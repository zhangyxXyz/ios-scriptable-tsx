import express from 'express'
import {networkInterfaces} from 'os'
import bodyParser from 'body-parser'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import type {Server} from 'http'
import {execFileSync} from 'child_process'

const qrcode = require('qrcode-terminal')
const port = 9090
let sfSymbols: Record<string, any> | undefined
let sfSymbolSourceNameMap: Map<string, any> | undefined

interface CreateServerParams {
    staticDir: string
    showQrcode?: boolean
}

interface PlaygroundServer {
    serverApi: string
    close(): Promise<void>
}

interface ConsoleApiBody {
    type: 'log' | 'warn' | 'error'
    data: unknown
}

interface ProxyQuery {
    url?: string
}

interface ProxyBody {
    url?: string
    method?: string
    headers?: Record<string, string>
    body?: string
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
const playgroundServerLockPath = path.join(playgroundCacheDir, 'playground-server.json')
const playgroundRoots: Record<string, string> = {
    '/documents': path.join(playgroundCacheDir, 'Documents'),
    '/library': path.join(playgroundCacheDir, 'Library'),
    '/tmp': path.join(playgroundCacheDir, 'tmp'),
    '/icloud': path.join(playgroundCacheDir, 'iCloud'),
}

interface PlaygroundServerLock {
    pid: number
    cwd: string
    port: number
    startedAt: string
}

function ensurePlaygroundCache(): void {
    fs.mkdirSync(playgroundCacheDir, {recursive: true})
    Object.values(playgroundRoots).forEach(dir => fs.mkdirSync(dir, {recursive: true}))
}

function isProcessAlive(pid: number): boolean {
    if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) return false

    try {
        process.kill(pid, 0)
        return true
    } catch {
        return false
    }
}

function sleepSync(ms: number): void {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function waitForProcessExit(pid: number, timeoutMs = 3000): boolean {
    const startedAt = Date.now()

    while (Date.now() - startedAt < timeoutMs) {
        if (!isProcessAlive(pid)) return true
        sleepSync(100)
    }

    return !isProcessAlive(pid)
}

function getPortListeningPids(targetPort: number): number[] {
    try {
        if (process.platform === 'win32') {
            const output = execFileSync('netstat', ['-ano', '-p', 'tcp'], {encoding: 'utf8'})
            const portPattern = new RegExp(`:${targetPort}\\s+.*\\s+LISTENING\\s+(\\d+)`, 'gi')
            return [...output.matchAll(portPattern)].map(match => Number(match[1])).filter(Number.isInteger)
        }

        execFileSync('sh', ['-c', `lsof -nP -iTCP:${targetPort} -sTCP:LISTEN >/dev/null 2>&1`], {stdio: 'ignore'})
        return [-1]
    } catch {
        return []
    }
}

function isPortInUse(targetPort: number): boolean {
    return getPortListeningPids(targetPort).length > 0
}

function waitForPortRelease(targetPort: number, timeoutMs = 3000): boolean {
    const startedAt = Date.now()

    while (Date.now() - startedAt < timeoutMs) {
        if (!isPortInUse(targetPort)) return true
        sleepSync(100)
    }

    return !isPortInUse(targetPort)
}

function readPlaygroundServerLock(): PlaygroundServerLock | undefined {
    try {
        if (!fs.existsSync(playgroundServerLockPath)) return undefined

        const lock = JSON.parse(fs.readFileSync(playgroundServerLockPath, 'utf8')) as Partial<PlaygroundServerLock>
        if (typeof lock.pid !== 'number' || typeof lock.cwd !== 'string' || lock.port !== port) return undefined

        return lock as PlaygroundServerLock
    } catch {
        return undefined
    }
}

function writePlaygroundServerLock(): void {
    fs.writeFileSync(
        playgroundServerLockPath,
        JSON.stringify(
            {
                pid: process.pid,
                cwd: process.cwd(),
                port,
                startedAt: new Date().toISOString(),
            } as PlaygroundServerLock,
            null,
            2,
        ),
        'utf8',
    )
}

function removePlaygroundServerLock(): void {
    try {
        const lock = readPlaygroundServerLock()
        if (!lock || lock.pid === process.pid) fs.rmSync(playgroundServerLockPath, {force: true})
    } catch {
        // Lock cleanup should never prevent the dev server from stopping.
    }
}

function stopStalePlaygroundServer(): void {
    const lock = readPlaygroundServerLock()
    if (!lock) return

    const isSameProject = path.resolve(lock.cwd) === path.resolve(process.cwd())
    const listeningPids = getPortListeningPids(port)
    const isLockOwnerListening = listeningPids.includes(lock.pid)
    if (!isSameProject || !isProcessAlive(lock.pid) || !isLockOwnerListening) {
        removePlaygroundServerLock()
        return
    }

    console.warn(`[watch] 9090 is still held by previous Playground server pid ${lock.pid}; stopping it...`)
    try {
        process.kill(lock.pid)
    } catch {
        // The stale process may have exited between the liveness check and kill.
    }

    if (!waitForProcessExit(lock.pid)) {
        throw new Error(`Previous Playground server pid ${lock.pid} did not exit; stop it manually and retry.`)
    }

    if (!waitForPortRelease(port)) {
        throw new Error(`Port ${port} is still in use after stopping previous Playground server pid ${lock.pid}.`)
    }

    removePlaygroundServerLock()
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

function sfSymbolNameToExportName(name: string): string {
    return `sf${name
        .split(/[.\-_]+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')}`
}

function getSfSymbol(name: string) {
    sfSymbols ||= require('@bradleyhodges/sfsymbols') as Record<string, any>
    const icon = sfSymbols[sfSymbolNameToExportName(name)]
    if (icon?.svgPathData) return icon

    if (!sfSymbolSourceNameMap) {
        sfSymbolSourceNameMap = new Map<string, any>()
        for (const item of Object.values(sfSymbols)) {
            if (item?.sourceName && item?.svgPathData) sfSymbolSourceNameMap.set(item.sourceName, item)
        }
    }
    return sfSymbolSourceNameMap.get(name)
}

function createSfSymbolSvg(name: string): string | undefined {
    const icon = getSfSymbol(name)
    if (!icon?.viewBox || !Array.isArray(icon.svgPathData)) return undefined

    const paths = icon.svgPathData
        .map((pathInfo: any) => {
            if (!pathInfo?.d) return ''
            const attrs = [`d="${escapeHtml(pathInfo.d)}"`]
            if (pathInfo.fillOpacity !== undefined) attrs.push(`fill-opacity="${Number(pathInfo.fillOpacity)}"`)
            if (pathInfo.fillRule) attrs.push(`fill-rule="${escapeHtml(pathInfo.fillRule)}"`)
            return `<path ${attrs.join(' ')} />`
        })
        .join('')

    if (!paths) return undefined

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${escapeHtml(icon.viewBox)}" fill="currentColor" aria-label="${escapeHtml(
        name,
    )}">${paths}</svg>`
}

function createSfSymbolPayload(name: string) {
    const icon = getSfSymbol(name)
    if (!icon?.viewBox || !Array.isArray(icon.svgPathData)) return undefined

    return {
        name,
        sourceName: icon.sourceName,
        viewBox: icon.viewBox,
        paths: icon.svgPathData
            .filter((pathInfo: any) => pathInfo?.d)
            .map((pathInfo: any) => ({
                d: pathInfo.d,
                fillOpacity: pathInfo.fillOpacity,
                fillRule: pathInfo.fillRule,
            })),
    }
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, char => {
        const entities: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }
        return entities[char]
    })
}

function createHomePage(serverApi: string): string {
    const playgroundUrl = `${serverApi}/playground`
    let qrText = ''
    qrcode.generate(playgroundUrl, {small: true}, (output: string) => {
        qrText = output
    })

    return `<!doctype html>
<html lang="zh-CN">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Scriptable Playground</title>
        <link rel="icon" type="image/png" href="/playground-assets/scriptable-appicon.png" />
        <style>
            :root {
                color-scheme: light;
                --bg: #f5f7fb;
                --bg-soft: #eef3fb;
                --panel: rgba(255, 255, 255, 0.82);
                --panel-solid: #ffffff;
                --text: #152033;
                --muted: #64748b;
                --line: rgba(120, 138, 163, 0.24);
                --line-strong: rgba(94, 112, 138, 0.38);
                --accent: #2563eb;
                --accent-strong: #1d4ed8;
                --accent-soft: rgba(37, 99, 235, 0.11);
                --shadow: 0 18px 45px rgba(34, 50, 84, 0.12);
                --shadow-soft: 0 10px 28px rgba(34, 50, 84, 0.09);
                --control-bg: rgba(255, 255, 255, 0.86);
                --control-hover: #f8fbff;
                --qr-bg: #0b1220;
                --qr-fg: #ffffff;
            }
            :root[data-theme='dark'] {
                color-scheme: dark;
                --bg: #070b13;
                --bg-soft: #0d1422;
                --panel: rgba(17, 24, 39, 0.72);
                --panel-solid: #111827;
                --text: #e5eaf3;
                --muted: #95a3b8;
                --line: rgba(148, 163, 184, 0.18);
                --line-strong: rgba(148, 163, 184, 0.28);
                --accent: #60a5fa;
                --accent-strong: #93c5fd;
                --accent-soft: rgba(96, 165, 250, 0.13);
                --shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
                --shadow-soft: 0 10px 28px rgba(0, 0, 0, 0.24);
                --control-bg: rgba(15, 23, 42, 0.78);
                --control-hover: rgba(30, 41, 59, 0.9);
                --qr-bg: #020617;
                --qr-fg: #f8fafc;
            }
            * {
                box-sizing: border-box;
            }
            html,
            body {
                min-height: 100%;
                margin: 0;
                background: var(--bg);
            }
            body {
                display: grid;
                place-items: center;
                padding: 28px;
                background:
                    radial-gradient(circle at 18% 18%, var(--accent-soft), transparent 28%),
                    linear-gradient(180deg, var(--bg), var(--bg-soft));
                color: var(--text);
                font:
                    14px/1.45 system-ui,
                    -apple-system,
                    BlinkMacSystemFont,
                    'Segoe UI',
                    sans-serif;
            }
            a,
            button {
                font: inherit;
            }
            .shell {
                width: min(920px, 100%);
                min-width: 0;
                border: 1px solid var(--line);
                border-radius: 8px;
                background: var(--panel);
                box-shadow: var(--shadow);
                backdrop-filter: blur(18px);
                overflow: hidden;
            }
            .topbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                padding: 18px 20px;
                border-bottom: 1px solid var(--line);
            }
            .brand {
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 0;
            }
            .brand img {
                width: 38px;
                height: 38px;
                border-radius: 8px;
                box-shadow: var(--shadow-soft);
            }
            .brand-title {
                margin: 0;
                font-size: 16px;
                font-weight: 760;
                line-height: 1.2;
            }
            .brand-url {
                margin-top: 3px;
                max-width: 58vw;
                color: var(--muted);
                font-size: 12px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .theme-toggle {
                display: inline-grid;
                place-items: center;
                flex: 0 0 auto;
                width: 38px;
                height: 38px;
                border: 1px solid var(--line);
                border-radius: 8px;
                background: var(--control-bg);
                color: var(--text);
                cursor: pointer;
            }
            .theme-toggle:hover {
                background: var(--control-hover);
                border-color: var(--line-strong);
            }
            .theme-toggle svg {
                display: none;
                width: 19px;
                height: 19px;
                stroke: currentColor;
                stroke-width: 1.8;
                fill: none;
            }
            .theme-toggle[data-theme-value='auto'] .theme-icon-auto,
            .theme-toggle[data-theme-value='light'] .theme-icon-light,
            .theme-toggle[data-theme-value='dark'] .theme-icon-dark {
                display: block;
            }
            .content {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 330px;
                gap: 28px;
                padding: 34px;
                align-items: center;
            }
            .content > * {
                min-width: 0;
            }
            .title {
                margin: 0;
                max-width: 560px;
                font-size: clamp(30px, 5vw, 54px);
                line-height: 1.02;
                letter-spacing: 0;
                overflow-wrap: anywhere;
            }
            .summary {
                margin: 18px 0 0;
                max-width: 540px;
                color: var(--muted);
                font-size: 15px;
                overflow-wrap: anywhere;
            }
            .actions {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 28px;
            }
            .button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                min-height: 42px;
                padding: 0 15px;
                border: 1px solid var(--line);
                border-radius: 8px;
                background: var(--control-bg);
                color: var(--text);
                text-decoration: none;
                cursor: pointer;
            }
            .button:hover {
                background: var(--control-hover);
                border-color: var(--line-strong);
            }
            .button.primary {
                border-color: transparent;
                background: linear-gradient(135deg, var(--accent), #14b8a6);
                color: #ffffff;
                font-weight: 760;
                box-shadow: var(--shadow-soft);
            }
            .button svg {
                width: 18px;
                height: 18px;
                stroke: currentColor;
                stroke-width: 2;
                fill: none;
            }
            .qr-panel {
                justify-self: end;
                width: 100%;
                min-width: 0;
                max-width: 330px;
                border: 1px solid var(--line);
                border-radius: 8px;
                background: var(--panel-solid);
                box-shadow: var(--shadow-soft);
                padding: 18px;
            }
            .qr-code {
                margin: 0;
                padding: 15px;
                border-radius: 8px;
                background: var(--qr-bg);
                color: var(--qr-fg);
                font-family: Consolas, 'Courier New', monospace;
                font-size: 9px;
                line-height: 1;
                letter-spacing: 0;
                white-space: pre;
                overflow: auto;
                max-width: 100%;
            }
            .qr-meta {
                margin-top: 14px;
                color: var(--muted);
                font-size: 12px;
                overflow-wrap: anywhere;
            }
            .toast {
                min-height: 20px;
                margin-top: 10px;
                color: var(--accent-strong);
                font-size: 12px;
            }
            @media (max-width: 760px) {
                body {
                    padding: 14px;
                    place-items: stretch;
                    overflow-x: hidden;
                }
                .shell {
                    width: 100%;
                    max-width: 100%;
                }
                .topbar,
                .content {
                    padding: 16px;
                }
                .content {
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
                .title {
                    max-width: 100%;
                    font-size: clamp(28px, 8vw, 34px);
                    line-height: 1.08;
                }
                .summary {
                    max-width: 100%;
                    font-size: 14px;
                }
                .title {
                    word-break: break-all;
                }
                .actions {
                    margin-top: 24px;
                }
                .qr-panel {
                    justify-self: stretch;
                    max-width: none;
                }
                .qr-code {
                    width: 100%;
                    min-width: 0;
                    font-size: min(2.3vw, 9px);
                    overflow-x: auto;
                }
                .brand-url {
                    max-width: 62vw;
                }
            }
        </style>
    </head>
    <body>
        <main class="shell">
            <header class="topbar">
                <div class="brand">
                    <img src="/playground-assets/scriptable-appicon.png" alt="" />
                    <div>
                        <h1 class="brand-title">Scriptable Playground</h1>
                        <div class="brand-url">${escapeHtml(playgroundUrl)}</div>
                    </div>
                </div>
                <button id="themeToggle" class="theme-toggle" type="button" aria-label="Theme">
                    <svg class="theme-icon theme-icon-auto" viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="4" y="5" width="16" height="11" rx="2"></rect>
                        <path d="M8 20h8M12 16v4"></path>
                    </svg>
                    <svg class="theme-icon theme-icon-light" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="4"></circle>
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
                    </svg>
                    <svg class="theme-icon theme-icon-dark" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20 14.2A7.5 7.5 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z"></path>
                    </svg>
                </button>
            </header>
            <section class="content">
                <div>
                    <h2 class="title">Open the local Scriptable workbench</h2>
                    <p class="summary">Run scripts, preview widgets, inspect logs and requests, or scan the QR code to open the same Playground on your phone.</p>
                    <div class="actions">
                        <a class="button primary" href="/playground">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M5 12h14M13 6l6 6-6 6"></path>
                            </svg>
                            Open Playground
                        </a>
                        <button id="copyUrl" class="button" type="button">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy URL
                        </button>
                    </div>
                    <div id="toast" class="toast" role="status"></div>
                </div>
                <aside class="qr-panel" aria-label="Playground QR code">
                    <pre class="qr-code">${escapeHtml(qrText)}</pre>
                    <div class="qr-meta">${escapeHtml(playgroundUrl)}</div>
                </aside>
            </section>
        </main>
        <script>
            const themeToggle = document.getElementById('themeToggle')
            const copyUrl = document.getElementById('copyUrl')
            const toast = document.getElementById('toast')
            const playgroundUrl = ${JSON.stringify(playgroundUrl)}

            function getInitialTheme() {
                const saved = localStorage.getItem('playground.theme')
                if (saved === 'dark' || saved === 'light' || saved === 'auto') return saved
                return 'auto'
            }

            function resolveTheme(theme) {
                if (theme === 'light' || theme === 'dark') return theme
                if (!window.matchMedia) return 'dark'
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            }

            function setTheme(theme, persist = true) {
                const preference = theme === 'light' || theme === 'dark' || theme === 'auto' ? theme : 'auto'
                document.documentElement.dataset.theme = resolveTheme(preference)
                document.documentElement.dataset.themePreference = preference
                themeToggle.dataset.themeValue = preference
                themeToggle.title = 'Theme: ' + preference
                themeToggle.setAttribute('aria-label', 'Theme: ' + preference)
                if (persist) localStorage.setItem('playground.theme', preference)
            }

            function cycleTheme() {
                const current = document.documentElement.dataset.themePreference || 'auto'
                setTheme(current === 'auto' ? 'light' : current === 'light' ? 'dark' : 'auto')
            }

            async function copyPlaygroundUrl() {
                try {
                    await navigator.clipboard.writeText(playgroundUrl)
                    toast.textContent = 'Copied'
                } catch {
                    toast.textContent = playgroundUrl
                }
            }

            setTheme(getInitialTheme(), false)
            themeToggle.addEventListener('click', cycleTheme)
            copyUrl.addEventListener('click', copyPlaygroundUrl)
            window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
                if (document.documentElement.dataset.themePreference === 'auto') setTheme('auto', false)
            })
        </script>
    </body>
</html>`
}

export function createServer(params: CreateServerParams): PlaygroundServer {
    const {staticDir, showQrcode = true} = params
    const app = express()
    const serverApi = `http://${getLocalIpAddress()}:${port}`
    const playgroundPath = path.resolve(__dirname, './static/playground.html')
    const playgroundMockDir = path.resolve(__dirname, './mock')
    const playgroundAssetsDir = path.resolve(__dirname, './static/assets')
    const scriptableDocsDir = path.resolve(process.cwd(), 'docs/scriptable-docs/site')
    ensurePlaygroundCache()
    stopStalePlaygroundServer()

    app.use(bodyParser.urlencoded({extended: false, limit: '25mb'}))
    app.use(bodyParser.json({limit: '25mb'}))
    app.use(express.static(staticDir))
    app.use('/mock', express.static(playgroundMockDir))
    app.use('/playground-assets', express.static(playgroundAssetsDir))
    if (fs.existsSync(scriptableDocsDir)) {
        app.use('/scriptable-docs', express.static(scriptableDocsDir))
    }

    app.get('/', (_req, res) => {
        res.type('html').send(createHomePage(serverApi))
    })

    app.get('/playground', (_req, res) => {
        res.sendFile(playgroundPath)
    })

    app.get('/api/sf-symbol.svg', (req, res) => {
        const name = String(req.query.name || '')
        if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
            res.status(400).send('Invalid symbol name')
            return
        }

        const svg = createSfSymbolSvg(name)
        if (!svg) {
            res.status(404).send('Symbol not found')
            return
        }

        res.type('image/svg+xml').send(svg)
    })

    app.get('/api/sf-symbol.json', (req, res) => {
        const name = String(req.query.name || '')
        if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
            res.status(400).send({code: 400, msg: 'Invalid symbol name'})
            return
        }

        const symbol = createSfSymbolPayload(name)
        if (!symbol) {
            res.status(404).send({code: 404, msg: 'Symbol not found'})
            return
        }

        res.send({
            code: ResCode.SUCCESS,
            msg: 'success',
            data: symbol,
        })
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

    app.all('/api/proxy', async (req, res) => {
        const query = req.query as ProxyQuery
        const body = (req.body || {}) as ProxyBody
        const url = String(body.url || query.url || '')
        if (!/^https?:\/\//.test(url)) {
            res.status(400).send({code: 400, msg: 'Only http(s) URLs are supported'})
            return
        }

        try {
            const method = String(body.method || 'GET').toUpperCase()
            const headers = {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari',
                ...(body.headers || {}),
            }
            const response = await fetch(url, {
                method,
                headers,
                body: method === 'GET' || method === 'HEAD' ? undefined : body.body,
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

    const server: Server = app.listen(port, () => {
        writePlaygroundServerLock()
        console.log(`手机访问 ${serverApi}`)
        showQrcode && qrcode.generate(serverApi, {small: true})
    })
    server.once('error', error => {
        if ((error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
            console.error(
                `[watch] Port ${port} is already in use by another process. Stop that process or change the Playground port before retrying.`,
            )
            process.exit(1)
        }
    })

    return {
        serverApi,
        close: () =>
            new Promise<void>((resolve, reject) => {
                server.close(error => {
                    if (error) {
                        reject(error)
                        return
                    }
                    removePlaygroundServerLock()
                    resolve()
                })
            }),
    }
}
