import {build, BuildOptions, OutputFile} from 'esbuild'
import fs from 'fs'
import path from 'path'
import {promisify} from 'util'
import {execFileSync} from 'child_process'
import {merge} from 'lodash'
import {obfuscate, ObfuscatorOptions} from 'javascript-obfuscator'
import {createServer} from './server'
import {loadEnvFiles} from './env'
import compileOptions from '../../scriptable.config'
import {ensureFile, remove} from 'fs-extra'
import * as prettier from 'prettier'

/**打包模式*/
export enum CompileType {
    /**打包一个文件夹*/
    ALL = 'all',

    /**为打包入口文件*/
    ONE = 'one',
}

export interface CompileOptions {
    /**项目根目录*/
    rootPath: string

    /**输入文件，当 compileType 为 one 时生效*/
    inputFile: string

    /**输入文件夹，当 compileType 为 all 时生效*/
    inputDir: string

    /**输出文件夹*/
    outputDir: string

    /**打包模式，all 为打包一个文件夹，one为打包入口文件*/
    compileType?: CompileType

    /**Optional comma-separated entry basename filter for partial builds.*/
    entryFilter?: string | string[]

    /**是否在 watch 开发*/
    watch?: boolean

    /**是否显示二维码*/
    showQrcode?: boolean

    /**
     * esbuild 自定义配置
     * see: https://esbuild.github.io/api/#simple-options
     */
    esbuild?: BuildOptions

    /**是否压缩代码*/
    minify?: boolean

    /**在编译中添加额外的头部，一般是作者信息*/
    header?: string

    /**Raw URL base for subscription entries, e.g. GitHub raw dist directory.*/
    subscriptionRawBaseUrl?: string

    /**是否加密代码*/
    encrypt?: boolean

    /**
     * javascript-obfuscator 自定义配置
     * see: https://github.com/javascript-obfuscator/javascript-obfuscator
     */
    encryptOptions?: ObfuscatorOptions
}

/**项目根目录*/
const rootPath = path.resolve(__dirname, '../')

/**输入文件，当 compileType 为 one 时生效*/
const inputFile: string = path.resolve(rootPath, './src/index.ts')

/**输入文件夹，当 compileType 为 all 时生效*/
const inputDir: string = path.resolve(rootPath, './src/scripts')

/**输出文件夹*/
const outputDir: string = path.resolve(rootPath, './dist')

/**打包模式，all 为打包一个文件夹，one为打包入口文件*/
const compileType = (process.env.compileType as CompileType) || CompileType.ONE

/**是否在 watch 开发*/
const watch = Boolean(process.env.watching)

/**是否压缩代码*/
const minify = process.env.NODE_ENV === 'production'

/**是否加密代码*/
const encrypt = process.env.NODE_ENV === 'production'

const _compileOptions = {
    rootPath,
    inputFile,
    inputDir,
    outputDir,
    compileType,
    watch,
    minify,
    encrypt,
    entryFilter: process.env.compileFilter,
}

compile(merge(_compileOptions, compileOptions || {}))

function runGit(rootPath: string, args: string[]) {
    try {
        return execFileSync('git', args, {cwd: rootPath, encoding: 'utf8'}).trim()
    } catch {
        return ''
    }
}

function normalizeGithubRemote(remoteUrl: string) {
    const gitSshMatch = remoteUrl.match(/^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/)
    if (gitSshMatch) return gitSshMatch[1]

    const httpsMatch = remoteUrl.match(/^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/)
    if (httpsMatch) return httpsMatch[1]

    return ''
}

function inferSubscriptionRawBaseUrl(rootPath: string) {
    const repo = normalizeGithubRemote(runGit(rootPath, ['remote', 'get-url', 'origin']))
    const branch = runGit(rootPath, ['branch', '--show-current']) || 'main'
    return repo ? `https://raw.githubusercontent.com/${repo}/${branch}/dist` : ''
}

function registerWatchCleanup(closeServer: () => Promise<void>): void {
    let isClosing = false

    const cleanup = async (signal: NodeJS.Signals): Promise<void> => {
        if (isClosing) return
        isClosing = true

        try {
            await closeServer()
            console.log(`[watch] Playground server closed by ${signal}`)
        } catch (error) {
            console.error(`[watch] Failed to close Playground server:`, error)
        }

        if (signal === 'SIGUSR2') {
            process.kill(process.pid, signal)
            return
        }
        process.exit(0)
    }

    ;(['SIGINT', 'SIGTERM', 'SIGBREAK', 'SIGHUP', 'SIGUSR2'] as NodeJS.Signals[]).forEach(signal => {
        process.once(signal, () => {
            void cleanup(signal)
        })
    })
}

async function compile(options: CompileOptions) {
    const {
        rootPath,
        inputDir,
        inputFile,
        outputDir,
        compileType = CompileType.ONE,
        watch = false,
        showQrcode = true,
        esbuild = {},
        minify = false,
        encrypt = false,
        encryptOptions = {},
        header = '',
        subscriptionRawBaseUrl = '',
        entryFilter = [],
    } = options

    /**加载环境变量 .env 文件*/
    loadEnvFiles(rootPath)

    const resolvedSubscriptionRawBaseUrl =
        process.env.SCRIPTABLE_RAW_BASE_URL ||
        process.env.SUBSCRIPTION_RAW_BASE_URL ||
        subscriptionRawBaseUrl ||
        inferSubscriptionRawBaseUrl(rootPath)

    if (watch) {
        /**创建服务器*/
        const playgroundServer = createServer({
            staticDir: outputDir,
            showQrcode,
        })
        registerWatchCleanup(playgroundServer.close)
    }

    // 编译时，把 process.env 环境变量替换成 dotenv 文件参数
    const define: Record<string, string> = {}
    for (const key in process.env) {
        //  不能含有括号、-号、空格
        if (/[\(\)\-\s]/.test(key)) continue
        define[`process.env.${key}`] = JSON.stringify(process.env[key])
    }
    define['process.env.SCRIPTABLE_RAW_BASE_URL'] = JSON.stringify(resolvedSubscriptionRawBaseUrl)
    define['process.env.SUBSCRIPTION_RAW_BASE_URL'] = JSON.stringify(resolvedSubscriptionRawBaseUrl)

    // 深度获取某个文件夹里所有文件路径（包括子文件夹）
    const readdir = promisify(fs.readdir)
    const stat = promisify(fs.stat)
    async function getFilesFromDir(dir: string): Promise<string[]> {
        const subdirs = await readdir(dir)
        const files = await Promise.all(
            subdirs.map(async subdir => {
                const res = path.resolve(dir, subdir)
                return (await stat(res)).isDirectory() ? getFilesFromDir(res) : res
            }),
        )
        return files.reduce((a: string[], f: string | string[]) => a.concat(f), [])
    }

    function resolveEntryImport(fromFile: string, importPath: string) {
        const basePath = path.resolve(path.dirname(fromFile), importPath)
        const candidates = [
            basePath,
            `${basePath}.ts`,
            `${basePath}.tsx`,
            `${basePath}.js`,
            `${basePath}.jsx`,
            path.join(basePath, 'index.ts'),
            path.join(basePath, 'index.tsx'),
            path.join(basePath, 'index.js'),
            path.join(basePath, 'index.jsx'),
        ]
        return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
    }

    function getEntryImports(entryFile: string) {
        const source = fs.readFileSync(entryFile, 'utf8')
        const imports = [...source.matchAll(/^\s*import\s+(?:['"]([^'"]+)['"]|[^'"]*?\s+from\s+['"]([^'"]+)['"])/gm)]
            .map(match => match[1] || match[2])
            .filter(importPath => importPath.startsWith('.'))
            .map(importPath => resolveEntryImport(entryFile, importPath))
            .filter(Boolean) as string[]
        return [...new Set(imports)]
    }

    function getBuildEntry(inputPath: string) {
        const isSeiunEnvEntry = path.basename(inputPath) === 'Seiun.Env.ts'
        return {
            entryPath: isSeiunEnvEntry ? path.resolve(rootPath, './src/env/runtime.ts') : inputPath,
            outputPath: isSeiunEnvEntry ? path.resolve(outputDir, 'Seiun.Env.js') : undefined,
        }
    }

    function createSeiunEnvBuildEntry(entryPath: string) {
        const stripModuleMarker = (source: string) => source.replace(/\nexport\s*\{\}\s*;?\s*$/g, '')
        let runtimeSource = stripModuleMarker(fs.readFileSync(entryPath, 'utf8'))
        const inlineModules = [
            {
                requireLine: "const {createWidgetBaseRuntime} = require('./widget-base')\n",
                modulePath: './src/env/widget-base.ts',
                exportName: 'createWidgetBaseRuntime',
            },
            {
                requireLine: "const {createStorageRuntime} = require('./storage')\n",
                modulePath: './src/env/storage.ts',
                exportName: 'createStorageRuntime',
            },
            {
                requireLine: "const {createStackUI} = require('./stack-ui')\n",
                modulePath: './src/env/stack-ui/index.ts',
                exportName: 'createStackUI',
            },
            {
                requireLine: "const {createPinyinRuntime} = require('./pinyin')\n",
                modulePath: './src/env/pinyin.ts',
                exportName: 'createPinyinRuntime',
            },
            {
                requireLine: "const {createCustomFontRuntime} = require('./custom-font')\n",
                modulePath: './src/env/custom-font.ts',
                exportName: 'createCustomFontRuntime',
            },
            {
                requireLine: "const {createUtilsRuntime} = require('./utils')\n",
                modulePath: './src/env/utils.ts',
                exportName: 'createUtilsRuntime',
            },
        ]

        for (const moduleInfo of inlineModules) {
            const sourcePath = path.resolve(rootPath, moduleInfo.modulePath)
            const moduleSource = stripModuleMarker(fs.readFileSync(sourcePath, 'utf8'))
                .replace(/^\/\*[\s\S]*?\*\/\s*/, '')
                .replace(new RegExp(`\\nmodule\\.exports = \\{\\s*${moduleInfo.exportName},\\s*\\}\\s*$`), '')
            const inlineSource = stripModuleMarker(moduleSource).trimEnd()

            runtimeSource = runtimeSource.replace(moduleInfo.requireLine, () => `${inlineSource}\n\n`)
        }

        const generatedEntryPath = path.resolve(rootPath, './node_modules/.cache/ios-scriptable-tsx/Seiun.Env.entry.ts')
        fs.mkdirSync(path.dirname(generatedEntryPath), {recursive: true})
        fs.writeFileSync(generatedEntryPath, runtimeSource, 'utf8')
        return generatedEntryPath
    }

    function formatCompileTime(date: Date) {
        const pad = (value: number) => String(value).padStart(2, '0')
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
            date.getMinutes(),
        )}:${pad(date.getSeconds())}`
    }

    function getScriptableTopComment(inputPath: string) {
        const source = fs.readFileSync(inputPath, 'utf8')
        if (!source.startsWith('// Variables used by Scriptable.')) return ''

        const lines: string[] = []
        for (const line of source.split(/\r?\n/)) {
            if (!line.startsWith('//')) break
            lines.push(line)
        }
        return lines.length ? `${lines.join('\n')}\n\n` : ''
    }

    function getSourceHeaderComment(inputPath: string) {
        let source = fs.readFileSync(inputPath, 'utf8')
        const scriptableTopComment = getScriptableTopComment(inputPath)
        if (scriptableTopComment) source = source.slice(scriptableTopComment.length)
        source = source.trimStart()

        const commentMatch = source.match(/^\/\*[\s\S]*?\*\//)
        return commentMatch ? commentMatch[0] : ''
    }

    function getHeaderWithCompileTime(inputPath: string) {
        const compileTimeLine = ` * build    :  ${formatCompileTime(new Date())}`
        const normalizedHeader = (getSourceHeaderComment(inputPath) || header).trimEnd()
        if (!normalizedHeader) return `// @编译时间 ${formatCompileTime(new Date())}`

        const headerLines = normalizedHeader.split(/\r?\n/)
        const dateLine = headerLines.findIndex(line => /^\s*\*\s*date\s*:/.test(line))
        if (dateLine !== -1) {
            headerLines.splice(dateLine + 1, 0, compileTimeLine)
            return headerLines.join('\n')
        }

        const blockCommentEndLine = headerLines.findIndex(line => line.includes('*/'))
        if (blockCommentEndLine !== -1) {
            headerLines.splice(blockCommentEndLine, 0, compileTimeLine)
            return headerLines.join('\n')
        }

        return `${normalizedHeader}\n// @编译时间 ${formatCompileTime(new Date())}`
    }

    function getEntryBanner(inputPath: string, includeTopLevelAwait = true) {
        const topLevelAwaitRuntime = includeTopLevelAwait
            ? `
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc
};
`
            : ''

        return `${getScriptableTopComment(inputPath)}${getHeaderWithCompileTime(inputPath)}

const MODULE = module;${topLevelAwaitRuntime}
    `
    }

    /**所有输出的文件信息集合*/
    function readHeaderField(source: string, field: string) {
        const match = source.match(new RegExp(`^\\s*\\*\\s*${field}\\s*:\\s*(.*)$`, 'm'))
        return match ? match[1].trim() : ''
    }

    function readAssignment(source: string, field: string) {
        const match = source.match(new RegExp(`\\bthis\\.${field}\\s*=\\s*["'\`]([^"'\`]+)["'\`]`))
        return match ? match[1].trim() : ''
    }

    function normalizeBuildLines(source: string) {
        return source.replace(/^\s*\*\s*build\s*:\s*.*$/gm, ' * build    :  <build>')
    }

    function joinRawUrl(baseUrl: string, fileName: string) {
        if (!baseUrl) return fileName
        return `${baseUrl.replace(/\/+$/, '')}/${fileName}`
    }

    const previousOutputTexts = new Map<string, string>()

    async function snapshotOutputDir(dir: string) {
        if (!fs.existsSync(dir)) return
        const files = await getFilesFromDir(dir)
        for (const file of files) {
            try {
                previousOutputTexts.set(path.resolve(file), fs.readFileSync(file, 'utf8'))
            } catch {}
        }
    }

    async function generateSubscriptionManifest(rawBaseUrl: string) {
        const buildTime = formatCompileTime(new Date())
        const files = (await fs.promises.readdir(outputDir))
            .filter(file => file.endsWith('.js'))
            .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))

        const scripts = files.map(file => {
            const source = fs.readFileSync(path.resolve(outputDir, file), 'utf8')
            const build = readHeaderField(source, 'build') || buildTime
            const version = readHeaderField(source, 'version') || build
            const zhName = readAssignment(source, 'name') || path.basename(file, '.js')
            const enName = readAssignment(source, 'en') || path.basename(file, '.js')
            const desc = readHeaderField(source, 'desc') || zhName || enName

            return {
                id: path.basename(file, '.js'),
                fileName: file,
                rawUrl: joinRawUrl(rawBaseUrl, file),
                name: {
                    zh: zhName,
                    en: enName,
                },
                desc,
                version,
                build,
            }
        })

        const manifest = {
            schemaVersion: 1,
            generatedAt: buildTime,
            rawBaseUrl: rawBaseUrl || '',
            scripts,
        }
        const manifestPath = path.resolve(outputDir, 'subscription.json')
        let manifestText = `${JSON.stringify(manifest, null, 2)}\n`
        const previousManifestText = previousOutputTexts.get(manifestPath)
        if (previousManifestText) {
            try {
                const previousManifest = JSON.parse(previousManifestText)
                const normalizedPrevious = {...previousManifest, generatedAt: '<generatedAt>'}
                const normalizedNext = {...manifest, generatedAt: '<generatedAt>'}
                if (JSON.stringify(normalizedPrevious) === JSON.stringify(normalizedNext)) {
                    manifestText = previousManifestText
                }
            } catch {}
        }
        await ensureFile(manifestPath)
        await writeFile(manifestPath, manifestText, {encoding: 'utf8'})
        console.log(`订阅清单已生成: ${manifestPath}`)
    }

    const outputFilesInfo: OutputFile[] = []

    try {
        /**计算输入文件路径集合*/
        let inputPaths: string[] =
            compileType === CompileType.ALL ? await getFilesFromDir(inputDir) : getEntryImports(inputFile)
        if (!inputPaths.length) inputPaths = [inputFile]
        const filters = (Array.isArray(entryFilter) ? entryFilter : entryFilter.split(','))
            .map(item => item.trim())
            .filter(Boolean)
        if (filters.length) {
            inputPaths = inputPaths.filter(inputPath => {
                const basename = path.basename(inputPath)
                const extless = basename.replace(/\.[^.]+$/, '')
                return filters.includes(basename) || filters.includes(extless)
            })
            if (!inputPaths.length) {
                throw new Error(`No entry files matched compileFilter=${filters.join(',')}`)
            }
        }

        /** esbuild 配置*/
        await snapshotOutputDir(outputDir)

        const jsxRuntimeInjectPath = path.resolve(rootPath, './src/env/stack-ui/jsx-runtime.ts')
        const shouldInjectJsxRuntime = (inputPath: string) => {
            const source = fs.readFileSync(inputPath, 'utf8')
            const usesWidgetJsx = /<w[a-zA-Z][\w-]*(\s|>|\/)/.test(source)
            if (!usesWidgetJsx) return false

            const hasLocalJsxFactory =
                /\{[^}]*\bh\b[^}]*\}\s*=\s*runtimeRequire\b/.test(source) ||
                /\b(?:const|let|var)\s+h\b/.test(source) ||
                /\bfunction\s+h\b/.test(source)
            return !hasLocalJsxFactory
        }

        const esbuildOptions: BuildOptions = {
            entryPoints: [],
            platform: 'node',
            charset: 'utf8',
            bundle: true,
            outdir: outputDir,
            footer: {
                js: `
await __topLevelAwait__();
`,
            },
            jsxFactory: 'h',
            jsxFragment: 'Fragment',
            define,
            minify,
            write: false,
        }

        // 最终打包环节
        // 先清空输出文件夹
        if (!filters.length) await remove(outputDir)

        // esbuild 打包
        for (const inputPath of inputPaths) {
            const {entryPath, outputPath} = getBuildEntry(inputPath)
            const buildEntryPath = outputPath ? createSeiunEnvBuildEntry(entryPath) : entryPath
            const groupOptions: BuildOptions = {
                ...esbuildOptions,
                entryPoints: [buildEntryPath],
                inject: shouldInjectJsxRuntime(buildEntryPath) ? [jsxRuntimeInjectPath] : [],
                banner: {js: getEntryBanner(buildEntryPath, !outputPath)},
            }
            if (outputPath) {
                delete groupOptions.outdir
                delete groupOptions.footer
                groupOptions.outfile = outputPath
                groupOptions.bundle = false
            }
            outputFilesInfo.push(...((await build(merge(groupOptions, esbuild))).outputFiles || []))
        }
        console.error('esbuild打包结束')
    } catch (err) {
        console.error('esbuild打包出错', err)
        process.exit(1)
    }

    const writeFile = promisify(fs.writeFile)
    for (const outputFile of outputFilesInfo) {
        let writeText = outputFile.text
        if (encrypt) {
            // 加密环节
            try {
                /**加密配置*/
                const _encryptOptions: ObfuscatorOptions = {
                    rotateStringArray: true,
                    selfDefending: true,
                    stringArray: true,
                    splitStringsChunkLength: 100,
                    stringArrayEncoding: ['rc4', 'base64'],
                }
                // 读取失败就跳下一轮
                if (!outputFile.text) continue

                // 加密代码
                const transformCode = obfuscate(
                    outputFile.text,
                    merge(_encryptOptions, encryptOptions),
                ).getObfuscatedCode()

                // 写入加入代码、和头部信息
                writeText = `${header}\n${transformCode}`
            } catch (err) {
                console.error('加密代码失败', err)
                process.exit(1)
            }
        }

        // 使用 Prettier 格式化代码
        try {
            const prettierConfig = await prettier.resolveConfig(outputFile.path)
            writeText = await prettier.format(writeText, {
                ...prettierConfig,
                parser: 'babel',
            })
            writeText = writeText.replace(/^\s*(?:;?\(['"]use strict['"]\);?|['"]use strict['"];?)\s*$/gm, '')
        } catch (err) {
            console.error('格式化代码失败', err)
        }

        // 确保路径存在
        const previousText = previousOutputTexts.get(path.resolve(outputFile.path))
        if (previousText && normalizeBuildLines(previousText) === normalizeBuildLines(writeText)) {
            writeText = previousText
        }

        await ensureFile(outputFile.path)
        // 写入代码
        await writeFile(outputFile.path, writeText, {encoding: 'utf8'})
    }

    console.log('加密代码结束')
    await generateSubscriptionManifest(resolvedSubscriptionRawBaseUrl)
    console.log('打包完成')
}
