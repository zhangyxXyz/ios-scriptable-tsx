// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: gauge.high;

/*
 * author   :  seiun
 * date     :  2026/06/11
 * desc     :  Done Hub 聚合额度监控，汇总 Codex 与 Claude 渠道用量
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

import type {SeiunEnv, SettingValue, WidgetStorage} from '@app/env/types'

declare const importModule: (moduleName: string) => SeiunEnv

const dependencyFileName = 'Seiun.Env.js'
const runtimeRequire = typeof require === 'undefined' ? importModule : require
const {WidgetBase, Runing, Utils, GenrateView} = runtimeRequire(dependencyFileName) as SeiunEnv

type DoneHubSettings = {
    requestSettings: {
        doneHubBaseUrl: SettingValue<string>
        doneHubApiKey: SettingValue<string>
        limit: SettingValue<number>
    }
    displaySettings: {
        pollIntervalMinutes: SettingValue<number>
        showUpdateTime: SettingValue<string>
    }
}

type DoneHubChannel = {
    id?: number
    type?: number
    name?: string
    group?: string
    tag?: string
    status?: number
}

type CodexRateLimitWindow = {
    used_percent?: number
    limit_window_seconds?: number
    reset_at?: number
}

type CodexUsage = {
    rate_limit?: {
        primary_window?: CodexRateLimitWindow
        secondary_window?: CodexRateLimitWindow
    }
    additional_rate_limits?: Array<{
        limit_name?: string
        rate_limit?: {
            primary_window?: CodexRateLimitWindow
            secondary_window?: CodexRateLimitWindow
        }
    }>
}

type ClaudeUsageWindow = {
    utilization?: number | null
    resets_at?: string
}

type ClaudeUsage = {
    five_hour?: ClaudeUsageWindow
    seven_day?: ClaudeUsageWindow
    seven_day_sonnet?: ClaudeUsageWindow | null
    seven_day_opus?: ClaudeUsageWindow | null
}

type DoneHubUsageItem = {
    channel?: DoneHubChannel
    data?: {
        usage?: CodexUsage | ClaudeUsage
        cached?: boolean
        stale?: boolean
        fetched_at?: number
        cache_ttl_seconds?: number
        next_refresh_at?: number
        warning?: string
    }
    error?: string
}

type DoneHubAggregateResponse = {
    success?: boolean
    message?: string
    data?: {
        cache_ttl_seconds?: number
        items?: DoneHubUsageItem[]
    }
}

type UsageProvider = 'codex' | 'claude'
type WindowKind = 'five-hour' | 'long'

type UsageRow = {
    key: string
    provider: UsageProvider
    title: string
    channelName: string
    remainingPercent: number
    usedPercent: number
    resetAt: number | null
    windowKind: WindowKind
    stale: boolean
}

type DoneHubUsageCache = {
    items: DoneHubUsageItem[]
    fetchedAt: number
}

type DoneHubStorage = WidgetStorage & {
    getStorageTime(key: string): string | Date | null
}

const DONE_HUB_USAGE_PATH = '/api/usage/channels'
const CACHE_KEY = 'donehub_usage_channels'

class DoneHubMonitor extends WidgetBase {
    name = 'DoneHub聚合监控'
    en = 'DoneHubMonitor'
    widgetParam = args.widgetParameter
    declare storage: DoneHubStorage

    items: DoneHubUsageItem[] = []
    dataFetchTime: number | null = null
    isRequestSuccess = false
    isDataExpired = false
    statusMessage = '等待刷新'

    currentSettings: DoneHubSettings = {
        requestSettings: {
            doneHubBaseUrl: {val: '', type: this.settingValTypeString},
            doneHubApiKey: {val: '', type: this.settingValTypeString},
            limit: {val: 12, type: this.settingValTypeInt},
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

        this.registerSettingCategory('requestSettings', 'Done Hub 设置', [
            {
                title: 'Done Hub 地址',
                desc: '例如 https://hub.example.com，不要以 / 结尾',
                icon: {name: 'link', color: '#2563EB'},
                type: 'text',
                option: {doneHubBaseUrl: ''},
                config: {placeholder: 'https://hub.example.com', style: 'compact'},
            },
            {
                title: 'Done Hub Key',
                desc: '填写 done-hub 用户令牌 sk-...',
                icon: {name: 'lock.shield', color: '#F2C94C'},
                type: 'text',
                option: {doneHubApiKey: ''},
                config: {placeholder: 'sk-...', style: 'compact'},
            },
            {
                title: '聚合数量',
                desc: '接口 limit 参数，默认 12，最大 50',
                icon: {name: 'number', color: '#27C46A'},
                type: 'text',
                option: {limit: '12'},
                config: {placeholder: '12', style: 'compact'},
            },
        ])

        this.registerSettingCategory('displaySettings', '显示设置', [
            {
                title: '检查间隔',
                desc: '缓存仍在间隔内时不会发起网络请求',
                icon: {name: 'timer', color: '#2F80ED'},
                type: 'text',
                option: {pollIntervalMinutes: '5'},
                config: {placeholder: '5', style: 'compact'},
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
                title: 'Done Hub 设置',
                desc: '配置聚合额度接口地址和 Key',
                icon: {name: 'server.rack', color: '#2563EB'},
                onAction: async () => {
                    await this.presentSettings(['requestSettings'])
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
                desc: '只清除聚合额度缓存',
                icon: {name: 'trash', color: '#EB5757'},
                onAction: async () => {
                    this.storage.removeStorage(this.getCacheKey())
                    await this.notify('已清除缓存', '下次刷新会重新请求 Done Hub 聚合接口')
                    return true
                },
            },
        ])
    }

    getDoneHubBaseUrl() {
        return String(this.currentSettings.requestSettings.doneHubBaseUrl.val || '').trim().replace(/\/+$/, '')
    }

    getDoneHubApiKey() {
        return String(this.currentSettings.requestSettings.doneHubApiKey.val || '').trim()
    }

    getLimit() {
        const value = Number(this.currentSettings.requestSettings.limit.val)
        if (!Number.isFinite(value) || value <= 0) return 12
        return Math.max(1, Math.min(Math.floor(value), 50))
    }

    getPollIntervalMinutes() {
        const value = Number(this.currentSettings.displaySettings.pollIntervalMinutes.val)
        if (!Number.isFinite(value) || value < 1) return 5
        return Math.max(1, Math.min(value, 60))
    }

    getCacheKey() {
        const baseUrl = this.getDoneHubBaseUrl() || 'donehub'
        return `${CACHE_KEY}_${baseUrl}_${this.getLimit()}`.replace(/[^A-Za-z0-9_-]/g, '_')
    }

    getCachedUsage(ignoreFreshness = false) {
        const interval = ignoreFreshness ? undefined : this.getPollIntervalMinutes()
        return this.storage.getStorage<DoneHubUsageCache>(this.getCacheKey(), interval)
    }

    useCache(cache: DoneHubUsageCache, expired: boolean, message: string) {
        this.items = cache.items
        this.dataFetchTime = cache.fetchedAt
        this.isRequestSuccess = false
        this.isDataExpired = expired
        this.statusMessage = message
    }

    async requestAggregateUsage() {
        const baseUrl = this.getDoneHubBaseUrl()
        const apiKey = this.getDoneHubApiKey()
        if (!baseUrl) throw new Error('请配置 Done Hub 地址')
        if (!apiKey) throw new Error('请配置 Done Hub Key')

        const request = new Request(`${baseUrl}${DONE_HUB_USAGE_PATH}?provider=all&limit=${encodeURIComponent(String(this.getLimit()))}`)
        request.method = 'GET'
        request.headers = {
            Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
            Accept: 'application/json',
        }
        request.timeoutInterval = 25

        let payload: unknown
        try {
            payload = await request.loadJSON()
        } catch (error) {
            const statusCode = Number(request.response?.statusCode ?? 0)
            if (statusCode > 0) throw new Error(`Done Hub 请求失败: HTTP ${statusCode}`)
            throw error
        }

        const response = payload as DoneHubAggregateResponse
        if (response?.success === false) throw new Error(response.message || 'Done Hub 请求失败')
        const items = response?.data?.items
        if (!Array.isArray(items)) throw new Error('Done Hub 响应缺少 items')
        console.log(`Done Hub 聚合额度请求成功: HTTP ${this.getHttpStatusLabel(request)}，items=${items.length}`)
        return items
    }

    getHttpStatusLabel(request: Request) {
        const statusCode = Number(request.response?.statusCode ?? 0)
        return statusCode > 0 ? String(statusCode) : 'OK'
    }

    async loadUsage() {
        const freshCache = this.getCachedUsage()
        if (freshCache?.items) {
            this.useCache(freshCache, false, '使用缓存')
            return
        }

        try {
            const items = await this.requestAggregateUsage()
            const fetchedAt = Date.now()
            this.storage.setStorage<DoneHubUsageCache>(this.getCacheKey(), {items, fetchedAt})
            this.items = items
            this.dataFetchTime = fetchedAt
            this.isRequestSuccess = true
            this.isDataExpired = false
            this.statusMessage = '在线'
        } catch (error) {
            console.log(`请求Done Hub聚合额度失败: ${error}`)
            const cache = this.getCachedUsage(true)
            if (cache?.items) {
                this.useCache(cache, true, '请求失败/使用缓存')
                return
            }
            this.statusMessage = String(error)
        }
    }

    getProvider(item: DoneHubUsageItem): UsageProvider | null {
        const usage = item.data?.usage
        if (usage && 'rate_limit' in usage) return 'codex'
        if (usage && ('five_hour' in usage || 'seven_day' in usage)) return 'claude'

        const text = `${item.channel?.name || ''} ${item.channel?.tag || ''}`.toLowerCase()
        if (text.includes('codex') || text.includes('openai')) return 'codex'
        if (text.includes('claude') || text.includes('anthropic')) return 'claude'
        return null
    }

    getChannelName(item: DoneHubUsageItem) {
        const name = String(item.channel?.name || '').trim()
        if (name) return name
        const id = item.channel?.id
        return id ? `Channel ${id}` : 'Done Hub'
    }

    getWindowLabel(seconds?: number) {
        const minutes = Number(seconds ?? 0) / 60
        if (Math.abs(minutes - 300) <= 15) return {label: '5 小时', kind: 'five-hour' as WindowKind}
        if (Math.abs(minutes - 10080) <= 504) return {label: '7 天', kind: 'long' as WindowKind}
        if (Math.abs(minutes - 1440) <= 72) return {label: '每日', kind: 'long' as WindowKind}
        if (minutes >= 60) return {label: `${Math.round(minutes / 60)} 小时`, kind: 'long' as WindowKind}
        return {label: '额度', kind: 'long' as WindowKind}
    }

    normalizeCodexWindow(item: DoneHubUsageItem, windowInfo: CodexRateLimitWindow | undefined, suffix: string, index: number): UsageRow | null {
        if (!windowInfo || typeof windowInfo.used_percent !== 'number') return null
        const channelName = this.getChannelName(item)
        const usedPercent = this.clampPercent(windowInfo.used_percent)
        const windowLabel = this.getWindowLabel(windowInfo.limit_window_seconds)
        return {
            key: `codex-${item.channel?.id ?? index}-${suffix}`,
            provider: 'codex',
            title: `${channelName} ${windowLabel.label}`,
            channelName,
            usedPercent,
            remainingPercent: this.clampPercent(100 - usedPercent),
            resetAt: typeof windowInfo.reset_at === 'number' ? windowInfo.reset_at * 1000 : null,
            windowKind: windowLabel.kind,
            stale: Boolean(item.data?.stale),
        }
    }

    normalizeClaudeWindow(item: DoneHubUsageItem, windowInfo: ClaudeUsageWindow | null | undefined, label: string, kind: WindowKind, index: number): UsageRow | null {
        if (!windowInfo || typeof windowInfo.utilization !== 'number') return null
        const channelName = this.getChannelName(item)
        const usedPercent = this.clampPercent(windowInfo.utilization)
        return {
            key: `claude-${item.channel?.id ?? index}-${label}`,
            provider: 'claude',
            title: `${channelName} ${label}`,
            channelName,
            usedPercent,
            remainingPercent: this.clampPercent(100 - usedPercent),
            resetAt: this.parseDateMs(windowInfo.resets_at),
            windowKind: kind,
            stale: Boolean(item.data?.stale),
        }
    }

    getCodexRows() {
        const rows: UsageRow[] = []
        this.items.forEach((item, index) => {
            if (this.getProvider(item) !== 'codex') return
            const usage = item.data?.usage as CodexUsage | undefined
            const primary = this.normalizeCodexWindow(item, usage?.rate_limit?.primary_window, 'primary', index)
            const secondary = this.normalizeCodexWindow(item, usage?.rate_limit?.secondary_window, 'secondary', index)
            if (primary) rows.push(primary)
            if (secondary) rows.push(secondary)
        })
        return rows
    }

    getClaudeRows() {
        const rows: UsageRow[] = []
        this.items.forEach((item, index) => {
            if (this.getProvider(item) !== 'claude') return
            const usage = item.data?.usage as ClaudeUsage | undefined
            const fiveHour = this.normalizeClaudeWindow(item, usage?.five_hour, '5 小时', 'five-hour', index)
            const sevenDay = this.normalizeClaudeWindow(item, usage?.seven_day, '7 天', 'long', index)
            if (fiveHour) rows.push(fiveHour)
            if (sevenDay) rows.push(sevenDay)
        })
        return rows
    }

    getMediumRows() {
        return [...this.getCodexRows(), ...this.getClaudeRows()].filter(row => row.windowKind === 'five-hour').slice(0, 4)
    }

    getLargeRows() {
        return [...this.getCodexRows().slice(0, 4), ...this.getClaudeRows().slice(0, 2)]
    }

    clampPercent(value: number) {
        if (!Number.isFinite(value)) return 0
        return Math.max(0, Math.min(100, value))
    }

    parseDateMs(value?: string) {
        if (!value) return null
        const date = new Date(value)
        return Number.isNaN(date.getTime()) ? null : date.getTime()
    }

    formatResetTime(ms: number | null) {
        if (!ms) return '未知'
        return Utils.time('MM-dd HH:mm', new Date(ms))
    }

    formatUpdateTime() {
        if (!this.dataFetchTime) return '暂无缓存'
        return Utils.time('HH:mm:ss', new Date(this.dataFetchTime))
    }

    getStatusColor() {
        if (this.isRequestSuccess) return new Color('#27C46A')
        return Color.red()
    }

    getFooterText() {
        if (this.currentSettings.displaySettings.showUpdateTime.val === '显示') {
            return `${this.statusMessage}  ↻ ${this.formatUpdateTime()}`
        }
        return this.statusMessage
    }

    getLayoutMetrics(compact = false) {
        const padding = {top: 10, right: 10, bottom: 10, left: 10}
        const cardGap = 10
        // 真机可用宽度通常比估算值小，额外收窄一段避免两张卡片铺得太开
        const contentInset = 16
        const widgetSize = this.getWidgetSize(this.widgetFamily === 'large' ? 'large' : 'medium')
        const cardWidth = Math.floor((widgetSize.width - padding.left - padding.right - contentInset - cardGap) / 2)
        const contentWidth = cardWidth * 2 + cardGap
        const cardHeight = compact ? 52 : 84
        const progressWidth = cardWidth - 20
        return {padding, cardGap, contentWidth, cardWidth, cardHeight, progressWidth}
    }

    addAlignedRow(widget: ListWidget, contentWidth: number) {
        const outer = widget.addStack()
        outer.layoutHorizontally()
        outer.addSpacer()
        const inner = outer.addStack()
        inner.layoutHorizontally()
        inner.centerAlignContent()
        inner.size = new Size(contentWidth, 0)
        outer.addSpacer()
        return inner
    }

    renderProgressBar(stack: WidgetStack, percent: number, width: number, height = 7) {
        const bar = stack.addStack()
        bar.layoutHorizontally()
        bar.backgroundColor = new Color('#DADDE3', 0.35)
        bar.cornerRadius = Math.floor(height / 2)
        bar.size = new Size(width, height)
        const fillWidth = Math.max(height, Math.round((width * this.clampPercent(percent)) / 100))
        const fill = bar.addStack()
        fill.backgroundColor = percent < 20 ? new Color('#EB5757') : percent < 50 ? new Color('#F2C94C') : new Color('#27C46A')
        fill.cornerRadius = Math.floor(height / 2)
        fill.size = new Size(fillWidth, height)
        bar.addSpacer()
    }

    renderProviderMark(parent: WidgetStack, provider: UsageProvider) {
        const mark = parent.addText(provider === 'codex' ? 'C' : 'A')
        mark.textColor = provider === 'codex' ? new Color('#0F9F58') : new Color('#D97706')
        mark.font = Font.boldSystemFont(10)
        mark.lineLimit = 1
        mark.minimumScaleFactor = 0.8
    }

    renderRowCard(parent: WidgetStack, row: UsageRow, cardWidth: number, cardHeight: number, progressWidth: number, compact = false) {
        const card = parent.addStack()
        card.layoutVertically()
        card.setPadding(compact ? 7 : 9, 10, compact ? 7 : 9, 10)
        card.backgroundColor = Color.dynamic(new Color('#FFFFFF', 0.78), new Color('#20232A', 0.92))
        card.cornerRadius = 8
        card.size = new Size(cardWidth, cardHeight)

        const titleRow = card.addStack()
        titleRow.layoutHorizontally()
        titleRow.centerAlignContent()
        this.renderProviderMark(titleRow, row.provider)
        titleRow.addSpacer(5)
        const title = titleRow.addText(row.title)
        title.textColor = this.widgetColor
        title.font = Font.mediumSystemFont(compact ? 8 : 9)
        title.textOpacity = 0.68
        title.lineLimit = 1
        title.minimumScaleFactor = 0.65
        titleRow.addSpacer()

        card.addSpacer(compact ? 2 : 3)
        const valueRow = card.addStack()
        valueRow.layoutHorizontally()
        valueRow.centerAlignContent()
        const value = valueRow.addText(`${Math.round(row.remainingPercent)}%`)
        value.textColor = row.remainingPercent < 20 ? Color.red() : this.widgetColor
        value.font = Font.boldSystemFont(compact ? 16 : 19)
        value.minimumScaleFactor = 0.65
        value.lineLimit = 1
        valueRow.addSpacer(4)
        const label = valueRow.addText('剩余')
        label.textColor = this.widgetColor
        label.font = Font.boldSystemFont(compact ? 11 : 13)
        label.minimumScaleFactor = 0.8
        label.lineLimit = 1

        card.addSpacer(compact ? 3 : 4)
        this.renderProgressBar(card, row.remainingPercent, progressWidth, compact ? 5 : 7)

        if (!compact) {
            card.addSpacer(5)
            const reset = card.addText(`${row.stale ? '缓存 ' : '重置 '}${this.formatResetTime(row.resetAt)}`)
            reset.textColor = this.widgetColor
            reset.font = Font.systemFont(9)
            reset.textOpacity = 0.55
            reset.lineLimit = 1
            reset.minimumScaleFactor = 0.7
        }
    }

    renderRows(widget: ListWidget, rows: UsageRow[], compact = false) {
        const {cardGap, contentWidth, cardWidth, cardHeight, progressWidth} = this.getLayoutMetrics(compact)
        if (rows.length === 0) {
            widget.addSpacer()
            const empty = widget.addText(this.statusMessage || '暂无额度数据')
            empty.textColor = Color.red()
            empty.font = Font.mediumSystemFont(13)
            empty.centerAlignText()
            widget.addSpacer()
            return
        }

        for (let i = 0; i < rows.length; i += 2) {
            const rowStack = this.addAlignedRow(widget, contentWidth)
            rowStack.spacing = cardGap
            this.renderRowCard(rowStack, rows[i], cardWidth, cardHeight, progressWidth, compact)
            if (rows[i + 1]) this.renderRowCard(rowStack, rows[i + 1], cardWidth, cardHeight, progressWidth, compact)
            if (i + 2 < rows.length) widget.addSpacer(compact ? 6 : 8)
        }
    }

    renderHeader(widget: ListWidget, subtitle: string) {
        const header = this.addAlignedRow(widget, this.getLayoutMetrics().contentWidth)
        const icon = header.addImage(SFSymbol.named('gauge.high').image)
        icon.imageSize = new Size(16, 16)
        icon.tintColor = new Color('#2563EB')
        header.addSpacer(6)
        const title = header.addText(`Done Hub | ${subtitle}`)
        title.textColor = this.widgetColor
        title.font = Font.boldSystemFont(15)
        title.textOpacity = 0.86
        title.lineLimit = 1
        title.minimumScaleFactor = 0.65
        header.addSpacer()
    }

    renderFooter(widget: ListWidget) {
        const footer = this.addAlignedRow(widget, this.getLayoutMetrics().contentWidth)
        const summary = footer.addText(`${this.getCodexRows().length} Codex · ${this.getClaudeRows().length} Claude`)
        summary.textColor = this.widgetColor
        summary.font = Font.mediumSystemFont(10)
        summary.textOpacity = 0.62
        summary.lineLimit = 1
        summary.minimumScaleFactor = 0.75
        footer.addSpacer()
        const status = footer.addText(this.getFooterText())
        status.textColor = this.getStatusColor()
        status.font = new Font('SF Mono', 10)
        status.textOpacity = 0.82
        status.lineLimit = 1
        status.minimumScaleFactor = 0.7
    }

    async renderMedium(widget: ListWidget) {
        GenrateView.setListWidget(widget)
        const {padding} = this.getLayoutMetrics(true)
        widget.setPadding(padding.top, padding.left, padding.bottom, padding.right)
        this.renderHeader(widget, '5 小时窗口')
        widget.addSpacer(8)
        this.renderRows(widget, this.getMediumRows(), true)
        widget.addSpacer()
        this.renderFooter(widget)
        return widget
    }

    async renderLarge(widget: ListWidget) {
        GenrateView.setListWidget(widget)
        const {padding} = this.getLayoutMetrics()
        widget.setPadding(padding.top, padding.left, padding.bottom, padding.right)
        this.renderHeader(widget, 'Codex 4 · Claude 2')
        widget.addSpacer(10)
        this.renderRows(widget, this.getLargeRows())
        widget.addSpacer()
        this.renderFooter(widget)
        return widget
    }

    async render() {
        const widget = new ListWidget()
        await this.getWidgetBackgroundImage(widget)
        await this.loadUsage()
        widget.url = `scriptable:///run/${encodeURIComponent(Script.name())}`

        switch (this.widgetFamily) {
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

EndAwait(() => Runing(DoneHubMonitor, args.widgetParameter, false))
