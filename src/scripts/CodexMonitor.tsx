// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: black; icon-glyph: terminal;

/*
 * author   :  seiun
 * date     :  2026/06/05
 * desc     :  Codex额度监控
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

import type {SeiunEnv, SettingValue, WidgetStorage} from '@app/env/types'

declare const importModule: (moduleName: string) => SeiunEnv

const dependencyFileName = 'Seiun.Env.js'
const runtimeRequire = typeof require === 'undefined' ? importModule : require
const {WidgetBase, Runing, Utils, GenrateView, h} = runtimeRequire(dependencyFileName) as SeiunEnv

type CodexSettings = {
    accountSettings: {
        defaultAccount: SettingValue<string>
    }
    displaySettings: {
        pollIntervalMinutes: SettingValue<number>
        showUpdateTime: SettingValue<string>
    }
}

type CodexCredential = {
    accountName: string
    accessToken: string
    accountId: string | null
    expiresAt: number | null
    savedAt: number
}

type CodexAccountStore = {
    version: number
    defaultAccountName: string
    accounts: CodexCredential[]
}

type RateLimitWindow = {
    used_percent?: number
    limit_window_seconds?: number
    reset_at?: number
    limit_reached?: boolean
    allowed?: boolean
}

type RateLimitPair = {
    primary_window?: RateLimitWindow
    secondary_window?: RateLimitWindow
}

type AdditionalRateLimit = {
    limit_name?: string
    rate_limit?: RateLimitPair
}

type CodexUsageStatus = {
    plan_type?: string
    rate_limit?: RateLimitPair
    credits?: {
        balance?: string | number | null
        has_credits?: boolean
        unlimited?: boolean
    }
    additional_rate_limits?: AdditionalRateLimit[]
    rate_limit_reached_type?: unknown
}

type CodexUsageCache = {
    usage: CodexUsageStatus
    fetchedAt: number
}

type ProbeResult = {
    ok: boolean
    message: string
}

type UsageRow = {
    key: string
    title: string
    usedPercent: number
    remainingPercent: number
    resetAt: number | null
    windowLabel: string
}

type CodexStorage = WidgetStorage & {
    getStorageTime(key: string): string | Date | null
}

const USAGE_URL = 'https://chatgpt.com/backend-api/wham/usage'
const PROBE_URL = 'https://developers.openai.com/codex'
const CACHE_KEY = 'codex_usage_status'
const CREDENTIAL_KEY = 'CodexMonitor.credential'
const CODEX_DESKTOP_USER_AGENT = 'Codex Desktop/26.601.2237.0 (Windows NT 10.0; x64)'
const CODEX_ICON_URL = 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/ImageHost/icon/codex.png'

class CodexMonitor extends WidgetBase {
    name = 'Codex监控'
    en = 'CodexMonitor'
    widgetParam = args.widgetParameter
    declare storage: CodexStorage

    usageStatus: CodexUsageStatus | null = null
    dataFetchTime: number | null = null
    isRequestSuccess = false
    isDataExpired = false
    statusMessage = '等待刷新'
    currentAccount: CodexCredential | null = null
    paramAccountIndex: number | null = null

    currentSettings: CodexSettings = {
        accountSettings: {
            defaultAccount: {val: '请选择或者添加账号', type: this.settingValTypeString},
        },
        displaySettings: {
            pollIntervalMinutes: {val: 5, type: this.settingValTypeInt},
            showUpdateTime: {val: '显示', type: this.settingValTypeString},
        },
    }

    constructor(scriptName?: string) {
        super(scriptName)
        this.storageExpirationMinutes = 5
        this.Run()
    }

    Run() {
        if (!config.runsInApp) return

        this.syncDefaultAccountSetting()

        this.registerSettingCategory('displaySettings', '显示设置', [
            {
                title: '检查间隔',
                desc: '缓存仍在间隔内时不会发起网络请求\n建议 5 分钟或更长',
                icon: {name: 'timer', color: '#2F80ED'},
                type: 'text',
                option: {pollIntervalMinutes: '5'},
                config: {
                    placeholder: '5',
                    style: 'compact',
                },
            },
            {
                title: '更新时间',
                desc: '显示上次成功拉取或缓存时间',
                icon: {name: 'arrow.clockwise', color: '#D11D0C'},
                type: 'select',
                option: {showUpdateTime: '显示'},
                config: {
                    selectOptions: [
                        {label: '显示', value: '显示'},
                        {label: '不显示', value: '不显示'},
                    ],
                    defaultShowContent: '显示',
                    multiple: false,
                },
            },
        ])

        this.registerSetting([
            {
                title: '账号管理',
                desc: '添加 Codex 鉴权账号，设置默认账号；Parameter 可填账号编号',
                icon: {name: 'key.fill', color: '#F2C94C'},
                type: 'text',
                option: {defaultAccount: this.currentSettings.accountSettings.defaultAccount.val},
                onAction: async () => {
                    await this.presentAuthPage()
                    this.syncDefaultAccountSetting()
                    return true
                },
            },
            {
                title: '显示设置',
                icon: {name: 'slider.horizontal.3', color: '#56CCF2'},
                onAction: async () => {
                    await this.presentSettings(['displaySettings'])
                    return true
                },
            },
            {
                title: '清除缓存',
                desc: '只清除额度缓存，不删除 Keychain 中的鉴权',
                icon: {name: 'trash', color: '#EB5757'},
                onAction: async () => {
                    this.storage.removeStorage(this.getCacheKey())
                    await this.notify('已清除缓存', '下次刷新会重新探测网络并请求额度')
                    return true
                },
            },
        ])
    }

    getPollIntervalMinutes() {
        const value = Number(this.currentSettings.displaySettings.pollIntervalMinutes.val)
        if (!Number.isFinite(value) || value < 1) return 5
        return Math.max(1, Math.min(value, 60))
    }

    parseWidgetParameter() {
        this.paramAccountIndex = null
        const raw = String(this.widgetParam ?? '').trim()
        if (!raw) return
        const index = parseInt(raw.split(',')[0].trim())
        if (!isNaN(index)) this.paramAccountIndex = index
    }

    getAccountStore(): CodexAccountStore {
        try {
            if (!Keychain.contains(CREDENTIAL_KEY)) return {version: 2, defaultAccountName: '请选择或者添加账号', accounts: []}
            const raw = Keychain.get(CREDENTIAL_KEY)
            const parsed = JSON.parse(raw) as Partial<CodexAccountStore> & Partial<CodexCredential>
            if (Array.isArray(parsed.accounts)) {
                const accounts = parsed.accounts.filter(account => account?.accessToken)
                return {
                    version: Number(parsed.version ?? 2),
                    defaultAccountName: String(parsed.defaultAccountName || accounts[0]?.accountName || '请选择或者添加账号'),
                    accounts,
                }
            }
            if (parsed.accessToken) {
                const legacyAccount: CodexCredential = {
                    accountName: parsed.accountName || parsed.accountId || 'Default',
                    accessToken: parsed.accessToken,
                    accountId: parsed.accountId ?? null,
                    expiresAt: parsed.expiresAt ?? null,
                    savedAt: parsed.savedAt ?? Math.floor(Date.now() / 1000),
                }
                const store = {
                    version: 2,
                    defaultAccountName: legacyAccount.accountName,
                    accounts: [legacyAccount],
                }
                this.saveAccountStore(store)
                return store
            }
        } catch (error) {
            console.log(`读取鉴权失败: ${error}`)
        }
        return {version: 2, defaultAccountName: '请选择或者添加账号', accounts: []}
    }

    getCacheKey(account = this.currentAccount) {
        const identity = account?.accountName || account?.accountId || 'default'
        return `${CACHE_KEY}_${identity.replace(/[^A-Za-z0-9_-]/g, '_')}`
    }

    saveAccountStore(store: CodexAccountStore) {
        const accounts = store.accounts.filter(account => account?.accessToken && account?.accountName)
        const defaultAccountName = accounts.some(account => account.accountName === store.defaultAccountName)
            ? store.defaultAccountName
            : accounts[0]?.accountName || '请选择或者添加账号'
        Keychain.set(CREDENTIAL_KEY, JSON.stringify({version: 2, defaultAccountName, accounts}))
        this.currentSettings.accountSettings.defaultAccount.val = defaultAccountName
    }

    getAccounts() {
        return this.getAccountStore().accounts
    }

    getDefaultAccountName() {
        const store = this.getAccountStore()
        return store.defaultAccountName || store.accounts[0]?.accountName || '请选择或者添加账号'
    }

    syncDefaultAccountSetting() {
        this.currentSettings.accountSettings.defaultAccount.val = this.getDefaultAccountName()
    }

    readCredential(): CodexCredential | null {
        this.parseWidgetParameter()
        const store = this.getAccountStore()
        if (this.paramAccountIndex !== null && store.accounts[this.paramAccountIndex]) {
            this.currentAccount = store.accounts[this.paramAccountIndex]
            return this.currentAccount
        }
        const defaultAccount = store.accounts.find(account => account.accountName === store.defaultAccountName) || store.accounts[0] || null
        this.currentAccount = defaultAccount
        return defaultAccount
    }

    parseCredentialFromInput(input: string, accountNameInput?: string): CodexCredential {
        const accessToken = this.extractAccessToken(input)
        if (!accessToken) throw new Error('未找到 access token')
        const payload = this.decodeJwtPayload(accessToken)
        const authInfo = payload['https://api.openai.com/auth'] as Record<string, unknown> | undefined
        const accountId = typeof authInfo?.chatgpt_account_id === 'string' ? authInfo.chatgpt_account_id : null
        const expiresAt = typeof payload.exp === 'number' ? payload.exp : null
        const accountName = (accountNameInput || accountId || `Account ${this.getAccounts().length + 1}`).trim()
        return {
            accountName,
            accessToken,
            accountId,
            expiresAt,
            savedAt: Math.floor(Date.now() / 1000),
        }
    }

    saveCredentialFromInput(input: string, accountNameInput?: string, setDefault = true) {
        const credential = this.parseCredentialFromInput(input, accountNameInput)
        const store = this.getAccountStore()
        const existingIndex = store.accounts.findIndex(account => account.accountName === credential.accountName)
        if (existingIndex >= 0) {
            store.accounts[existingIndex] = credential
        } else {
            store.accounts.push(credential)
        }
        if (setDefault || !store.defaultAccountName || store.defaultAccountName === '请选择或者添加账号') {
            store.defaultAccountName = credential.accountName
        }
        this.saveAccountStore(store)
        this.currentAccount = credential
        return credential
    }

    extractAccessToken(input: string) {
        const value = input.trim()
        if (!value) return null
        try {
            const parsed = JSON.parse(value) as Record<string, unknown>
            const token = (parsed.tokens as Record<string, unknown> | undefined)?.access_token
            if (typeof token === 'string' && token.includes('.')) return token.trim()
        } catch {
            // Not JSON, continue parsing as raw token.
        }
        const bearerMatch = value.match(/Bearer\s+([A-Za-z0-9._-]+)/)
        if (bearerMatch?.[1]) return bearerMatch[1]
        const tokenMatch = value.match(/eyJ[A-Za-z0-9._-]+/)
        return tokenMatch?.[0] ?? null
    }

    decodeJwtPayload(token: string): Record<string, unknown> {
        const payload = token.split('.')[1]
        if (!payload) throw new Error('access token 格式异常')
        let base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
        while (base64.length % 4 !== 0) base64 += '='
        const data = Data.fromBase64String(base64)
        if (!data) throw new Error('access token payload 解码失败')
        const raw = data.toRawString()
        if (!raw) throw new Error('access token payload 不是 UTF-8')
        return JSON.parse(raw) as Record<string, unknown>
    }

    isCredentialExpired(credential: CodexCredential | null) {
        if (!credential?.expiresAt) return false
        return credential.expiresAt <= Math.floor(Date.now() / 1000) + 60
    }

    async probeCodexSite(): Promise<ProbeResult> {
        try {
            const request = new Request(PROBE_URL)
            request.method = 'GET'
            request.timeoutInterval = 8
            await request.loadString()
            const statusCode = Number(request.response?.statusCode ?? 0)
            if (statusCode > 0) {
                console.log(`Codex官网探测成功: HTTP ${statusCode}`)
                return {ok: true, message: `官网 HTTP ${statusCode}`}
            }
            return {ok: true, message: '官网可访问'}
        } catch (error) {
            const message = `官网探测失败: ${this.shortError(error)}`
            console.log(message)
            return {ok: false, message}
        }
    }

    shortError(error: unknown) {
        const text = String(error ?? '')
        return text.length > 80 ? `${text.slice(0, 77)}...` : text
    }

    async requestUsage(credential: CodexCredential) {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${credential.accessToken}`,
            originator: 'Codex Desktop',
            'User-Agent': CODEX_DESKTOP_USER_AGENT,
            'Accept-Language': 'zh-CN,zh;q=0.9',
        }
        if (credential.accountId) {
            headers['ChatGPT-Account-Id'] = credential.accountId
        }

        const request = new Request(USAGE_URL)
        request.method = 'GET'
        request.headers = headers
        request.timeoutInterval = 15
        let data: CodexUsageStatus | null = null
        try {
            data = (await request.loadJSON()) as CodexUsageStatus
        } catch (error) {
            const statusCode = Number(request.response?.statusCode ?? 0)
            if (statusCode > 0) throw new Error(`请求失败: HTTP ${statusCode}`)
            throw error
        }
        const statusCode = Number(request.response?.statusCode ?? 0)
        if (!data || typeof data !== 'object' || !data.rate_limit) {
            if (statusCode > 0) throw new Error(`请求失败: HTTP ${statusCode}`)
            throw new Error('响应缺少 rate_limit')
        }
        console.log(`Codex额度请求成功: HTTP ${statusCode || 'unknown'}`)
        return data
    }

    getCachedUsage(ignoreFreshness = false) {
        const interval = ignoreFreshness ? undefined : this.getPollIntervalMinutes()
        return this.storage.getStorage<CodexUsageCache>(this.getCacheKey(), interval)
    }

    getAnyCachedUsage() {
        return this.storage.getStorage<CodexUsageCache>(this.getCacheKey())
    }

    useCache(cache: CodexUsageCache, expired: boolean, message: string) {
        this.usageStatus = cache.usage
        this.dataFetchTime = cache.fetchedAt
        this.isRequestSuccess = false
        this.isDataExpired = expired
        this.statusMessage = message
    }

    isRateLimitError(error: unknown) {
        const text = String(error ?? '').toLowerCase()
        return text.includes('429') || text.includes('rate limit') || text.includes('too many requests')
    }

    async loadUsage() {
        const credential = this.readCredential()
        if (!credential) {
            const cache = this.getAnyCachedUsage()
            if (cache?.usage) {
                this.useCache(cache, true, '未配置鉴权，显示缓存')
                return
            }
            this.statusMessage = '请先配置鉴权'
            return
        }

        const freshCache = this.getCachedUsage()
        if (freshCache?.usage) {
            this.useCache(freshCache, false, '使用缓存')
            return
        }

        if (this.isCredentialExpired(credential)) {
            const cache = this.getAnyCachedUsage()
            if (cache?.usage) {
                this.useCache(cache, true, '鉴权已过期，显示缓存')
                return
            }
            this.statusMessage = '鉴权已过期'
            return
        }

        const probe = await this.probeCodexSite()
        if (!probe.ok) {
            const cache = this.getAnyCachedUsage()
            if (cache?.usage) {
                this.useCache(cache, true, '网络障碍/使用缓存')
                return
            }
            this.statusMessage = probe.message
            return
        }

        try {
            const usage = await this.requestUsage(credential)
            const fetchedAt = Date.now()
            this.storage.setStorage<CodexUsageCache>(this.getCacheKey(credential), {usage, fetchedAt})
            this.usageStatus = usage
            this.dataFetchTime = fetchedAt
            this.isRequestSuccess = true
            this.isDataExpired = false
            this.statusMessage = '在线'
        } catch (error) {
            console.log(`请求Codex额度失败: ${error}`)
            const cache = this.getAnyCachedUsage()
            if (cache?.usage) {
                this.useCache(cache, true, this.isRateLimitError(error) ? '频率限制/使用缓存' : '请求失败/使用缓存')
                return
            }
            this.statusMessage = String(error)
        }
    }

    getWindowLabel(seconds?: number) {
        const minutes = Number(seconds ?? 0) / 60
        if (Math.abs(minutes - 300) <= 15) return '5 小时'
        if (Math.abs(minutes - 10080) <= 504) return '每周'
        if (Math.abs(minutes - 1440) <= 72) return '每日'
        if (minutes >= 40000 && minutes <= 46000) return '每月'
        if (minutes >= 60) return `${Math.round(minutes / 60)} 小时`
        if (minutes > 0) return `${Math.round(minutes)} 分钟`
        return '额度'
    }

    normalizeWindow(title: string, windowInfo: RateLimitWindow | undefined, fallbackKey: string): UsageRow | null {
        if (!windowInfo) return null
        const used = this.clampPercent(windowInfo.used_percent ?? 0)
        const windowLabel = this.getWindowLabel(windowInfo.limit_window_seconds)
        return {
            key: `${fallbackKey}-${windowLabel}`,
            title: `${title ? `${title} ` : ''}${windowLabel}使用限额`,
            usedPercent: used,
            remainingPercent: this.clampPercent(100 - used),
            resetAt: typeof windowInfo.reset_at === 'number' ? windowInfo.reset_at : null,
            windowLabel,
        }
    }

    getUsageRows() {
        const rows: UsageRow[] = []
        const core = this.usageStatus?.rate_limit
        const primary = this.normalizeWindow('', core?.primary_window, 'core-primary')
        const secondary = this.normalizeWindow('', core?.secondary_window, 'core-secondary')
        if (primary) rows.push(primary)
        if (secondary) rows.push(secondary)

        const additional = this.usageStatus?.additional_rate_limits ?? []
        for (const item of additional) {
            const name = item.limit_name?.trim() || '模型'
            const p = this.normalizeWindow(name, item.rate_limit?.primary_window, `${name}-primary`)
            const s = this.normalizeWindow(name, item.rate_limit?.secondary_window, `${name}-secondary`)
            if (p) rows.push(p)
            if (s) rows.push(s)
        }
        return rows
    }

    clampPercent(value: number) {
        if (!Number.isFinite(value)) return 0
        return Math.max(0, Math.min(100, value))
    }

    formatResetTime(seconds: number | null) {
        if (!seconds) return '未知'
        return Utils.time('yyyy年MM月dd日 HH:mm', new Date(seconds * 1000))
    }

    formatUpdateTime() {
        if (!this.dataFetchTime) return '暂无缓存'
        return Utils.time('HH:mm:ss', new Date(this.dataFetchTime))
    }

    getStatusColor() {
        if (this.isRequestSuccess) return new Color('#27C46A')
        return Color.red()
    }

    getPlanLabel() {
        const planType = this.usageStatus?.plan_type
        return planType ? String(planType).toUpperCase() : '未连接'
    }

    getTitleText() {
        return 'Codex'
    }

    getAccountLabel() {
        return this.currentAccount?.accountName ? `@${this.currentAccount.accountName}` : '@未配置'
    }

    getCreditText() {
        const credits = this.usageStatus?.credits
        if (!credits) return '无额度数据'
        if (credits.unlimited) return '无限'
        return `${credits.balance ?? 0} $`
    }

    getLayoutMetrics() {
        const contentWidth = this.widgetFamily === 'large' ? 320 : 310
        const cardGap = this.widgetFamily === 'large' ? 24 : 22
        const cardWidth = Math.floor((contentWidth - cardGap) / 2)
        return {contentWidth, cardGap, cardWidth}
    }

    estimateTextWidth(text: string, fontSize: number, min: number, max: number) {
        let asciiCount = 0
        let wideCount = 0
        for (const char of text) {
            if (char.charCodeAt(0) <= 127) asciiCount += 1
            else wideCount += 1
        }
        const asciiWidth = asciiCount * fontSize * 0.62
        const wideWidth = wideCount * fontSize
        return Math.max(min, Math.min(Math.ceil(asciiWidth + wideWidth), max))
    }

    async presentAuthPage() {
        const current = this.readCredential()
        const webView = new WebView()
        await webView.loadHTML(this.buildAuthHtml(current))

        let closed = false
        webView.present(false).then(() => {
            closed = true
        })

        while (!closed) {
            await new Promise(resolve => Timer.schedule(250, false, () => resolve(undefined)))
            if (closed) break

            const action = (await webView.evaluateJavaScript(
                `(function(){
                    var action = window.__codexAction || '';
                    if (action) window.__codexAction = '';
                    return action;
                })()`,
                false,
            )) as string

            if (action === 'clear') {
                if (Keychain.contains(CREDENTIAL_KEY)) Keychain.remove(CREDENTIAL_KEY)
                this.currentAccount = null
                this.syncDefaultAccountSetting()
                await webView.evaluateJavaScript(
                    `window.setStatus('已清除全部鉴权', 'warn'); window.setSavedInfo('未配置'); window.renderAccounts(${JSON.stringify(
                        this.getAccountListHtml(),
                    )});`,
                    false,
                )
            } else if (action.startsWith('account_')) {
                const index = parseInt(action.replace('account_', ''))
                const result = await this.presentAccountAction(index)
                if (result) {
                    await webView.evaluateJavaScript(
                        `window.setStatus(${JSON.stringify(result.message)}, ${JSON.stringify(result.type)}); window.renderAccounts(${JSON.stringify(
                            this.getAccountListHtml(),
                        )}); window.setSavedInfo(${JSON.stringify(this.getSavedInfoHtml(this.readCredential()))});`,
                        false,
                    )
                }
            } else if (action === 'open') {
                Safari.open('https://chatgpt.com/')
            } else if (action === 'docs') {
                Safari.open('https://developers.openai.com/codex/auth')
            } else if (action === 'save') {
                const form = (await webView.evaluateJavaScript(
                    `(function(){
                        return {
                            accountName: document.getElementById('accountName').value || '',
                            authInput: document.getElementById('authInput').value || '',
                            setDefault: document.getElementById('setDefault').checked
                        };
                    })()`,
                    false,
                )) as {accountName?: string; authInput?: string; setDefault?: boolean}
                try {
                    const credential = this.saveCredentialFromInput(form.authInput || '', form.accountName || '', Boolean(form.setDefault))
                    await webView.evaluateJavaScript(
                        `window.setStatus(${JSON.stringify(`保存成功：${credential.accountName}`)}, 'ok'); window.setSavedInfo(${JSON.stringify(
                            this.getSavedInfoHtml(credential),
                        )}); window.renderAccounts(${JSON.stringify(this.getAccountListHtml())});`,
                        false,
                    )
                } catch (error) {
                    await webView.evaluateJavaScript(
                        `window.setStatus(${JSON.stringify(`保存失败：${error}`)}, 'bad');`,
                        false,
                    )
                }
            }
        }
    }

    async presentAccountAction(index: number) {
        const store = this.getAccountStore()
        const account = store.accounts[index]
        if (!account) return null

        const actionAlert = new Alert()
        actionAlert.title = account.accountName || '账号操作'
        actionAlert.message = `编号: ${index}\n${account.accountId || '未识别 account id'}`
        actionAlert.addAction('设为默认')
        actionAlert.addAction('修改')
        actionAlert.addAction('复制')
        actionAlert.addDestructiveAction('删除')
        actionAlert.addCancelAction('取消')
        const actionIndex = await actionAlert.presentAlert()

        switch (actionIndex) {
            case 0:
                return this.setDefaultAccount(index)
            case 1:
                return await this.editAccount(index)
            case 2:
                return await this.copyAccount(index)
            case 3:
                return await this.deleteAccount(index)
            default:
                return null
        }
    }

    setDefaultAccount(index: number) {
        const store = this.getAccountStore()
        const account = store.accounts[index]
        if (!account) return null
        store.defaultAccountName = account.accountName
        this.saveAccountStore(store)
        return {message: `已设为默认：${account.accountName}`, type: 'ok'}
    }

    async editAccount(index: number) {
        const store = this.getAccountStore()
        const account = store.accounts[index]
        if (!account) return null

        const alert = new Alert()
        alert.title = '修改账号'
        alert.message = '可修改账号标识，或替换 access token'
        alert.addTextField('账号标识名字', account.accountName || '')
        alert.addTextField('access token / auth.json（留空不变）', '')
        alert.addAction('确定')
        alert.addCancelAction('取消')
        const result = await alert.presentAlert()
        if (result === -1) return null

        const oldName = account.accountName
        const nextName = alert.textFieldValue(0).trim()
        const tokenInput = alert.textFieldValue(1).trim()
        if (!nextName) return {message: '账号标识不能为空', type: 'bad'}

        let nextAccount: CodexCredential = {...account, accountName: nextName}
        if (tokenInput) {
            nextAccount = this.parseCredentialFromInput(tokenInput, nextName)
        }

        store.accounts[index] = nextAccount
        if (store.defaultAccountName === oldName) store.defaultAccountName = nextName
        this.saveAccountStore(store)
        return {message: `已修改：${nextName}`, type: 'ok'}
    }

    async copyAccount(index: number) {
        const store = this.getAccountStore()
        const account = store.accounts[index]
        if (!account) return null

        const alert = new Alert()
        alert.title = '复制账号'
        alert.message = '请输入新账号标识'
        alert.addTextField('账号标识名字', `${account.accountName || 'Account'} 副本`)
        alert.addAction('确定')
        alert.addCancelAction('取消')
        const result = await alert.presentAlert()
        if (result === -1) return null

        const accountName = alert.textFieldValue(0).trim()
        if (!accountName) return {message: '账号标识不能为空', type: 'bad'}
        const copied = {...account, accountName, savedAt: Math.floor(Date.now() / 1000)}
        store.accounts.splice(index + 1, 0, copied)
        this.saveAccountStore(store)
        return {message: `已复制：${accountName}`, type: 'ok'}
    }

    async deleteAccount(index: number) {
        const store = this.getAccountStore()
        const account = store.accounts[index]
        if (!account) return null

        const alert = new Alert()
        alert.title = '确认删除'
        alert.message = `确定要删除账号 "${account.accountName}" 吗？`
        alert.addCancelAction('取消')
        alert.addDestructiveAction('删除')
        const result = await alert.presentAlert()
        if (result !== 0) return null

        store.accounts.splice(index, 1)
        if (store.defaultAccountName === account.accountName) {
            store.defaultAccountName = store.accounts[0]?.accountName || '请选择或者添加账号'
        }
        this.saveAccountStore(store)
        this.storage.removeStorage(this.getCacheKey(account))
        return {message: `已删除：${account.accountName}`, type: 'warn'}
    }

    getSavedInfoHtml(current: CodexCredential | null) {
        return current
            ? `Name: ${this.escapeHtml(current.accountName)}<br>Account: ${this.escapeHtml(current.accountId ?? '未识别')}<br>Expires: ${
                  current.expiresAt ? this.escapeHtml(Utils.time('yyyy-MM-dd HH:mm', new Date(current.expiresAt * 1000))) : '未知'
              }`
            : '未配置'
    }

    getAccountListHtml() {
        const store = this.getAccountStore()
        if (store.accounts.length === 0) {
            return '<div class="empty">暂无账号，保存鉴权后会出现在这里。</div>'
        }
        return store.accounts
            .map((account, index) => {
                const isDefault = account.accountName === store.defaultAccountName
                const expires = account.expiresAt ? Utils.time('yyyy-MM-dd HH:mm', new Date(account.expiresAt * 1000)) : '未知'
                return `<div class="account" onclick="act('account_${index}')">
  <div class="account-main">
    <div class="account-name">${this.escapeHtml(account.accountName)}${isDefault ? '<span class="badge">默认</span>' : ''}</div>
    <div class="account-meta">编号: ${index} | Account: ${this.escapeHtml(account.accountId ?? '未识别')} | Expires: ${this.escapeHtml(expires)}</div>
  </div>
  <div class="arrow">›</div>
</div>`
            })
            .join('')
    }

    buildAuthHtml(current: CodexCredential | null) {
        const savedInfo = this.getSavedInfoHtml(current)
        const accountListHtml = this.getAccountListHtml()
        return `
<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>
:root{color-scheme:light dark;--bg:#f4f5f7;--card:#fff;--text:#111827;--muted:#6b7280;--line:#e5e7eb;--accent:#0f9f58;--danger:#d92d20}
@media(prefers-color-scheme:dark){:root{--bg:#08090b;--card:#181a1f;--text:#f5f7fb;--muted:#a7acb7;--line:#2b2f38}}
*{box-sizing:border-box}body{margin:0;padding:18px;background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;color:var(--text)}
.title{font-size:28px;font-weight:750;margin:18px 2px 6px}.sub{font-size:14px;line-height:1.45;color:var(--muted);margin:0 2px 16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px;margin-bottom:12px}
.label{font-size:13px;color:var(--muted);margin-bottom:8px}.saved{font-family:"SF Mono",ui-monospace,monospace;font-size:12px;line-height:1.45;color:var(--muted)}
input,textarea{width:100%;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--text);padding:12px;font-family:"SF Mono",ui-monospace,monospace;font-size:12px;outline:none}textarea{min-height:170px;margin-top:10px}
.row{display:flex;gap:10px;margin-top:12px}.btn{flex:1;border:0;border-radius:8px;padding:12px 10px;font-size:15px;font-weight:650;color:#fff;background:#2563eb}.btn.secondary{background:#374151}.btn.warn{background:var(--danger)}
.hint{font-size:12px;color:var(--muted);line-height:1.5}.status{font-size:13px;font-weight:650;margin-top:10px}.status.ok{color:var(--accent)}.status.bad,.status.warn{color:var(--danger)}
.check{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:13px;margin-top:10px}.check input{width:auto}.account{display:flex;align-items:center;gap:10px;padding:12px 0;border-top:1px solid var(--line);cursor:pointer}.account:first-child{border-top:0}.account:active{opacity:.72}.account-main{flex:1;min-width:0}.account-name{font-size:15px;font-weight:700}.account-meta{font-family:"SF Mono",ui-monospace,monospace;font-size:11px;color:var(--muted);line-height:1.45;word-break:break-all}.badge{display:inline-block;margin-left:8px;padding:2px 6px;border-radius:999px;background:var(--accent);color:#fff;font-size:11px}.arrow{font-size:24px;color:var(--muted)}.empty{color:var(--muted);font-size:13px;padding:8px 0}
</style>
</head>
<body>
<div class="title">Codex 鉴权</div>
<p class="sub">粘贴桌面 Codex 的 <b>auth.json</b> 内容，或只粘贴 <b>access_token</b>。脚本只保存 access token、account id 和过期时间到 Scriptable Keychain。</p>
<div class="card">
  <div class="label">当前状态</div>
  <div id="savedInfo" class="saved">${savedInfo}</div>
  <div id="status" class="status"></div>
</div>
<div class="card">
  <div class="label">保存账号</div>
  <input id="accountName" spellcheck="false" placeholder="账号标识名字，例如 Pro / Team / 小号">
  <textarea id="authInput" spellcheck="false" placeholder='粘贴 {"tokens":{"access_token":"..."}} 或 Bearer eyJ...'></textarea>
  <label class="check"><input id="setDefault" type="checkbox" checked> 保存后设为默认账号</label>
  <div class="row"><button class="btn" onclick="act('save')">保存鉴权</button><button class="btn warn" onclick="act('clear')">清除</button></div>
</div>
<div class="card">
  <div class="label">账号列表</div>
  <div id="accountList">${accountListHtml}</div>
</div>
<div class="card">
  <div class="hint">桌面端路径通常是 <b>~/.codex/auth.json</b>。Parameter 填 <b>0</b> 使用第一个账号，填 <b>1</b> 使用第二个账号；不填则使用默认账号。</div>
  <div class="row"><button class="btn secondary" onclick="act('open')">打开 ChatGPT</button><button class="btn secondary" onclick="act('docs')">官方鉴权文档</button></div>
</div>
<script>
function act(name){ window.__codexAction = name; }
window.setStatus=function(text,type){var el=document.getElementById('status');el.innerText=text;el.className='status '+(type||'');}
window.setSavedInfo=function(html){document.getElementById('savedInfo').innerHTML=html;}
window.renderAccounts=function(html){document.getElementById('accountList').innerHTML=html;}
</script>
</body>
</html>`
    }

    escapeHtml(value: unknown) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
    }

    renderProgressBar(stack: WidgetStack, percent: number, width: number) {
        const bar = stack.addStack()
        bar.layoutHorizontally()
        bar.backgroundColor = new Color('#DADDE3', 0.35)
        bar.cornerRadius = 4
        bar.size = new Size(width, 7)
        const fillWidth = Math.max(3, Math.round((width * this.clampPercent(percent)) / 100))
        const fill = bar.addStack()
        fill.backgroundColor = percent < 20 ? new Color('#EB5757') : percent < 50 ? new Color('#F2C94C') : new Color('#27C46A')
        fill.cornerRadius = 4
        fill.size = new Size(fillWidth, 7)
        bar.addSpacer()
    }

    renderRowCard(parent: WidgetStack, row: UsageRow, width: number) {
        const card = parent.addStack()
        card.layoutVertically()
        card.setPadding(9, 10, 9, 10)
        card.backgroundColor = Color.dynamic(new Color('#FFFFFF', 0.78), new Color('#20232A', 0.92))
        card.cornerRadius = 8
        card.size = new Size(width, 84)

        const title = card.addText(row.title)
        title.textColor = this.widgetColor
        title.font = Font.mediumSystemFont(9)
        title.textOpacity = 0.68
        title.lineLimit = 1
        title.minimumScaleFactor = 0.75

        card.addSpacer(2)
        const percentRow = card.addStack()
        percentRow.layoutHorizontally()
        percentRow.centerAlignContent()
        const percent = percentRow.addText(`${Math.round(row.remainingPercent)}%`)
        percent.textColor = this.widgetColor
        percent.font = Font.boldSystemFont(19)
        percent.minimumScaleFactor = 0.75
        percent.lineLimit = 1
        percentRow.addSpacer(4)
        const remaining = percentRow.addText('剩余')
        remaining.textColor = this.widgetColor
        remaining.font = Font.boldSystemFont(13)
        remaining.minimumScaleFactor = 0.8
        remaining.lineLimit = 1

        card.addSpacer(3)
        this.renderProgressBar(card, row.remainingPercent, width - 20)
        card.addSpacer(5)

        const reset = card.addText(`重置 ${this.formatResetTime(row.resetAt)}`)
        reset.textColor = this.widgetColor
        reset.font = Font.systemFont(9)
        reset.textOpacity = 0.55
        reset.lineLimit = 1
        reset.minimumScaleFactor = 0.7
    }

    async renderSmall(widget: ListWidget) {
        const rows = this.getUsageRows()
        const worst = rows.length > 0 ? rows.reduce((min, row) => (row.remainingPercent < min.remainingPercent ? row : min), rows[0]) : null
        GenrateView.setListWidget(widget)
        widget.setPadding(12, 12, 12, 12)
        widget.addSpacer(2)
        const titleRow = widget.addStack()
        titleRow.layoutHorizontally()
        titleRow.centerAlignContent()
        if (CODEX_ICON_URL) {
            try {
                const iconImage = await this.getImageByUrl(CODEX_ICON_URL)
                if (iconImage) {
                    const icon = titleRow.addImage(iconImage)
                    icon.imageSize = new Size(22, 22)
                    icon.cornerRadius = 4
                    titleRow.addSpacer(6)
                }
            } catch (error) {
                console.log(`加载Codex图标失败: ${error}`)
            }
        }
        const title = titleRow.addText(this.getTitleText())
        title.textColor = this.widgetColor
        title.font = Font.boldSystemFont(14)
        title.textOpacity = 0.78
        title.lineLimit = 1
        title.minimumScaleFactor = 0.7
        titleRow.addSpacer()

        widget.addSpacer(4)
        const subTitleRow = widget.addStack()
        subTitleRow.layoutHorizontally()
        const accountText = `${this.getAccountLabel()} | ${this.getPlanLabel()}`
        const account = subTitleRow.addText(accountText)
        account.textColor = this.widgetColor
        account.font = Font.mediumSystemFont(11)
        account.textOpacity = 0.68
        account.lineLimit = 1
        account.minimumScaleFactor = 0.65
        subTitleRow.addSpacer()

        widget.addSpacer(8)
        const value = widget.addText(worst ? `${Math.round(worst.remainingPercent)}%` : '--')
        value.textColor = worst && worst.remainingPercent < 20 ? Color.red() : this.widgetColor
        value.font = Font.boldSystemFont(36)
        value.minimumScaleFactor = 0.7
        widget.addSpacer(4)
        const label = widget.addText(worst ? worst.title.replace('Codex ', '') : this.statusMessage)
        label.textColor = this.widgetColor
        label.font = Font.systemFont(10)
        label.textOpacity = 0.58
        label.lineLimit = 2
        widget.addSpacer()
        const timeRow = widget.addStack()
        timeRow.layoutHorizontally()
        timeRow.addSpacer()
        const timeIcon = timeRow.addImage(SFSymbol.named('arrow.clockwise').image)
        timeIcon.imageSize = new Size(8, 8)
        timeIcon.tintColor = this.getStatusColor()
        timeIcon.imageOpacity = 0.75
        timeRow.addSpacer(4)
        const time = timeRow.addText(this.formatUpdateTime())
        time.textColor = this.getStatusColor()
        time.font = new Font('SF Mono', 9)
        time.textOpacity = 0.75
        return widget
    }

    async renderMedium(widget: ListWidget) {
        return await this.renderCommon(widget, 2)
    }

    async renderLarge(widget: ListWidget) {
        return await this.renderCommon(widget, 4)
    }

    async renderCommon(widget: ListWidget, maxRows: number) {
        GenrateView.setListWidget(widget)
        widget.setPadding(13, 14, 12, 14)
        const {contentWidth, cardGap, cardWidth} = this.getLayoutMetrics()

        const header = widget.addStack()
        header.layoutHorizontally()
        header.centerAlignContent()
        header.size = new Size(contentWidth, 24)
        if (CODEX_ICON_URL) {
            try {
                const iconImage = await this.getImageByUrl(CODEX_ICON_URL)
                if (iconImage) {
                    const icon = header.addImage(iconImage)
                    icon.imageSize = new Size(16, 16)
                    icon.cornerRadius = 3
                    header.addSpacer(6)
                }
            } catch (error) {
                console.log(`加载Codex图标失败: ${error}`)
            }
        }
        const headerTitleText = `${this.getTitleText()} ${this.getAccountLabel()} | ${this.getPlanLabel()}`
        const title = header.addText(headerTitleText)
        title.textColor = this.widgetColor
        title.font = Font.boldSystemFont(15)
        title.textOpacity = 0.86
        title.lineLimit = 1
        title.minimumScaleFactor = 0.65
        header.addSpacer()

        widget.addSpacer(10)

        const rows = this.getUsageRows().slice(0, maxRows)
        if (rows.length === 0) {
            widget.addSpacer()
            const empty = widget.addText(this.statusMessage || '暂无额度数据')
            empty.textColor = Color.red()
            empty.font = Font.mediumSystemFont(13)
            empty.centerAlignText()
            widget.addSpacer()
        } else {
            for (let i = 0; i < rows.length; i += 2) {
                const rowStack = widget.addStack()
                rowStack.layoutHorizontally()
                rowStack.spacing = cardGap
                this.renderRowCard(rowStack, rows[i], cardWidth)
                if (rows[i + 1]) this.renderRowCard(rowStack, rows[i + 1], cardWidth)
                widget.addSpacer(8)
            }
        }

        const footer = widget.addStack()
        footer.layoutHorizontally()
        footer.centerAlignContent()
        footer.setPadding(0, 5, 0, 0)
        footer.size = new Size(contentWidth, 16)
        const credit = footer.addText(`账户余额：${this.getCreditText()}`)
        credit.textColor = this.widgetColor
        credit.font = Font.mediumSystemFont(10)
        credit.textOpacity = 0.62
        credit.lineLimit = 1
        credit.minimumScaleFactor = 0.75
        credit.size = new Size(112, 16)
        footer.addSpacer()

        const statusText =
            this.currentSettings.displaySettings.showUpdateTime.val === '显示'
                ? `${this.statusMessage}  ↻ ${this.formatUpdateTime()}`
                : this.statusMessage
        const status = footer.addText(statusText)
        status.textColor = this.getStatusColor()
        status.font = new Font('SF Mono', 10)
        status.textOpacity = 0.82
        status.lineLimit = 1
        status.minimumScaleFactor = 0.7

        return widget
    }

    async render() {
        const widget = new ListWidget()
        await this.getWidgetBackgroundImage(widget)
        await this.loadUsage()
        widget.url = `scriptable:///run/${encodeURIComponent(Script.name())}`

        switch (this.widgetFamily) {
            case 'small':
                return await this.renderSmall(widget)
            case 'medium':
                return await this.renderMedium(widget)
            case 'large':
                return await this.renderLarge(widget)
            default:
                await Utils.renderUnsupport(widget)
                return widget
        }
    }
}

EndAwait(() => Runing(CodexMonitor, args.widgetParameter, false))
