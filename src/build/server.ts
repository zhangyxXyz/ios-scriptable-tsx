import express from 'express'
import {networkInterfaces} from 'os'
import bodyParser from 'body-parser'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'

const qrcode = require('qrcode-terminal')
const port = 9090

interface CreateServerParams {
    staticDir: string
    showQrcode?: boolean
}

interface ConsoleApiBody {
    type: 'log' | 'warn' | 'error'
    data: unknown
}

interface ProxyQuery {
    url?: string
}

interface ScriptQuery {
    file?: string
}

interface FsQuery {
    path?: string
}

interface FsBody {
    path?: string
    value?: string
    base64?: string
    recursive?: boolean
}

enum ResCode {
    SUCCESS = 0,
}

interface Res<T = unknown> {
    code: ResCode
    msg: string
    data?: T
}

function getLocalIpAddress(): string {
    const nets = networkInterfaces()
    for (const name of Object.keys(nets)) {
        const interfaces = nets[name]
        if (!interfaces) continue

        for (const net of interfaces) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address
            }
        }
    }
    return 'localhost'
}

const playgroundCacheDir = path.resolve(process.cwd(), '.cache')
const playgroundRoots: Record<string, string> = {
    '/documents': path.join(playgroundCacheDir, 'Documents'),
    '/library': path.join(playgroundCacheDir, 'Library'),
    '/tmp': path.join(playgroundCacheDir, 'tmp'),
    '/icloud': path.join(playgroundCacheDir, 'iCloud'),
}

function ensurePlaygroundCache(): void {
    fs.mkdirSync(playgroundCacheDir, {recursive: true})
    Object.values(playgroundRoots).forEach(dir => fs.mkdirSync(dir, {recursive: true}))
}

function resolveScriptablePath(input = '/documents'): string {
    const normalized = input.replace(/\\/g, '/').replace(/\/+/g, '/')
    const keychainPath = '/documents/storage/keychain.json'

    if (normalized === keychainPath) {
        const target = path.resolve(playgroundCacheDir, 'keychain.json')

        return target
    }

    const rootKey =
        Object.keys(playgroundRoots).find(key => normalized === key || normalized.startsWith(`${key}/`)) || '/documents'
    const relative = normalized.startsWith(rootKey) ? normalized.slice(rootKey.length) : normalized
    const root = path.resolve(playgroundRoots[rootKey])
    const target = path.resolve(root, `.${relative || ''}`)

    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
        throw new Error(`Path outside playground cache: ${input}`)
    }

    return target
}

function inferContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    if (ext === '.png') return 'image/png'
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
    if (ext === '.gif') return 'image/gif'
    if (ext === '.webp') return 'image/webp'
    if (ext === '.svg') return 'image/svg+xml'
    if (ext === '.json') return 'application/json'
    if (ext === '.txt') return 'text/plain; charset=utf-8'
    return 'application/octet-stream'
}

export function createServer(params: CreateServerParams): {serverApi: string} {
    const {staticDir, showQrcode = true} = params
    const app = express()
    const serverApi = `http://${getLocalIpAddress()}:${port}`
    const playgroundPath = path.resolve(__dirname, './static/playground.html')
    const playgroundMockDir = path.resolve(__dirname, './mock')
    const playgroundAssetsDir = path.resolve(__dirname, './static/assets')
    const scriptableDocsDir = path.resolve(process.cwd(), 'docs/scriptable-docs/site')
    ensurePlaygroundCache()

    app.use(bodyParser.urlencoded({extended: false, limit: '25mb'}))
    app.use(bodyParser.json({limit: '25mb'}))
    app.use(express.static(staticDir))
    app.use('/mock', express.static(playgroundMockDir))
    app.use('/playground-assets', express.static(playgroundAssetsDir))
    if (fs.existsSync(scriptableDocsDir)) {
        app.use('/scriptable-docs', express.static(scriptableDocsDir))
    }

    app.get('/', (_req, res) => {
        res.send({serverApi})
    })

    app.get('/playground', (_req, res) => {
        res.sendFile(playgroundPath)
    })

    app.get('/api/scripts', (_req, res) => {
        const scripts = fs
            .readdirSync(staticDir)
            .filter(file => file.endsWith('.js'))
            .sort((a, b) => a.localeCompare(b))
        res.send({
            code: ResCode.SUCCESS,
            msg: 'success',
            data: scripts,
        } as Res<string[]>)
    })

    app.get('/api/script', (req, res) => {
        const {file = ''} = req.query as ScriptQuery
        if (!file.endsWith('.js') || path.basename(file) !== file) {
            res.status(400).send({code: 400, msg: 'Invalid script file'})
            return
        }

        const filePath = path.resolve(staticDir, file)
        const root = path.resolve(staticDir)
        if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
            res.status(400).send({code: 400, msg: 'Invalid script path'})
            return
        }
        if (!fs.existsSync(filePath)) {
            res.status(404).send({code: 404, msg: 'Script not found'})
            return
        }

        res.type('application/javascript; charset=utf-8').send(fs.readFileSync(filePath, 'utf8'))
    })

    app.get('/api/scriptable-docs', (_req, res) => {
        const docs = fs.existsSync(scriptableDocsDir)
            ? fs
                  .readdirSync(scriptableDocsDir)
                  .filter(file => fs.statSync(path.join(scriptableDocsDir, file)).isDirectory())
                  .filter(file => fs.existsSync(path.join(scriptableDocsDir, file, 'index.html')))
                  .sort((a, b) => a.localeCompare(b))
            : []
        res.send({
            code: ResCode.SUCCESS,
            msg: 'success',
            data: docs,
        } as Res<string[]>)
    })

    app.get('/api/proxy', async (req, res) => {
        const {url = ''} = req.query as ProxyQuery
        if (!/^https?:\/\//.test(url)) {
            res.status(400).send({code: 400, msg: 'Only http(s) URLs are supported'})
            return
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari',
                },
            })
            const contentType = response.headers.get('content-type') || 'text/plain; charset=utf-8'
            const arrayBuffer = await response.arrayBuffer()
            res.status(response.status)
            res.setHeader('content-type', contentType)
            res.send(Buffer.from(arrayBuffer))
        } catch (error) {
            res.status(502).send({
                code: 502,
                msg: error instanceof Error ? error.message : String(error),
            })
        }
    })

    app.post('/api/fs/write-string', (req, res) => {
        const {path: file = '', value = ''} = req.body as FsBody
        const filePath = resolveScriptablePath(file)
        fs.mkdirSync(path.dirname(filePath), {recursive: true})
        fs.writeFileSync(filePath, value, 'utf8')
        res.send({code: ResCode.SUCCESS, msg: 'success'} as Res)
    })

    app.post('/api/fs/write-data', (req, res) => {
        const {path: file = '', base64 = ''} = req.body as FsBody
        const filePath = resolveScriptablePath(file)
        fs.mkdirSync(path.dirname(filePath), {recursive: true})
        fs.writeFileSync(filePath, Buffer.from(base64, 'base64'))
        res.send({code: ResCode.SUCCESS, msg: 'success'} as Res)
    })

    app.get('/api/fs/read-string', (req, res) => {
        const {path: file = ''} = req.query as FsQuery
        const filePath = resolveScriptablePath(file)
        res.send({
            code: ResCode.SUCCESS,
            msg: 'success',
            data: fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '',
        } as Res<string>)
    })

    app.get('/api/fs/read-data', (req, res) => {
        const {path: file = ''} = req.query as FsQuery
        const filePath = resolveScriptablePath(file)
        const data = fs.existsSync(filePath) ? fs.readFileSync(filePath) : Buffer.from('')
        res.send({
            code: ResCode.SUCCESS,
            msg: 'success',
            data: {
                base64: data.toString('base64'),
                contentType: inferContentType(filePath),
            },
        } as Res)
    })

    app.get('/api/fs/exists', (req, res) => {
        const {path: file = ''} = req.query as FsQuery
        res.send({
            code: ResCode.SUCCESS,
            msg: 'success',
            data: fs.existsSync(resolveScriptablePath(file)),
        } as Res<boolean>)
    })

    app.post('/api/fs/mkdir', (req, res) => {
        const {path: file = '', recursive = true} = req.body as FsBody
        fs.mkdirSync(resolveScriptablePath(file), {recursive})
        res.send({code: ResCode.SUCCESS, msg: 'success'} as Res)
    })

    app.post('/api/fs/remove', (req, res) => {
        const {path: file = ''} = req.body as FsBody
        const filePath = resolveScriptablePath(file)
        if (fs.existsSync(filePath)) fs.rmSync(filePath, {recursive: true, force: true})
        res.send({code: ResCode.SUCCESS, msg: 'success'} as Res)
    })

    app.get('/api/fs/list', (req, res) => {
        const {path: file = ''} = req.query as FsQuery
        const filePath = resolveScriptablePath(file)
        res.send({
            code: ResCode.SUCCESS,
            msg: 'success',
            data: fs.existsSync(filePath) && fs.statSync(filePath).isDirectory() ? fs.readdirSync(filePath) : [],
        } as Res<string[]>)
    })

    app.get('/api/fs/stat', (req, res) => {
        const {path: file = ''} = req.query as FsQuery
        const filePath = resolveScriptablePath(file)
        const stat = fs.existsSync(filePath) ? fs.statSync(filePath) : undefined
        res.send({
            code: ResCode.SUCCESS,
            msg: 'success',
            data: stat
                ? {
                      createdAt: stat.birthtime.toISOString(),
                      modifiedAt: stat.mtime.toISOString(),
                      size: stat.size,
                      isDirectory: stat.isDirectory(),
                  }
                : null,
        } as Res)
    })

    app.post('/console', (req, res) => {
        const {type = 'log', data = ''} = req.body as ConsoleApiBody
        const logTime = new Date().toLocaleString().split(' ')[1]
        const logParams = [`[${type} ${logTime}]`, typeof data !== 'object' ? data : JSON.stringify(data, null, 2)]

        switch (type) {
            case 'warn':
                console.warn(chalk.yellow(...logParams))
                break
            case 'error':
                console.error(chalk.red(...logParams))
                break
            case 'log':
            default:
                console.log(chalk.green(...logParams))
                break
        }

        res.send({
            code: ResCode.SUCCESS,
            msg: 'success',
        } as Res)
    })

    app.listen(port)
    console.log(`手机访问 ${serverApi}`)
    showQrcode && qrcode.generate(serverApi, {small: true})
    return {serverApi}
}
