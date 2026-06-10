// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: paper-plane;

/*
* author   :  seiun
* date     :  2021/10/18
* desc     :  机场流量
* version  :  2.0.0
* github   :  https://github.com/zhangyxXyz/ios-scriptable
* changelog:
*   v2.0.0 (2025/12/3)
*     - 使用 WebView 重写账号管理页面
*     - 增加 Medium 尺寸支持
*     - 绘制逻辑 JSX 化
*   v1.0.0 (2021/10/18)
*     - 初始版本
*/

import type {SeiunEnv} from '@app/env/types'

declare const importModule: (moduleName: string) => SeiunEnv

const dependencyFileName = 'Seiun.Env.js'
const runtimeRequire = typeof require === 'undefined' ? importModule : require
const {WidgetBase, Runing, Utils, GenrateView, h} = runtimeRequire(dependencyFileName) as SeiunEnv

// 常量定义
const canvSize = 200
const canvTextSize = 40
const canvWidth = 22 //Battery circle thickness
const canvRadius = 85 //Battery circle radius
const displayArcSize = 65 // 圆环在小组件中的显示尺寸

type AirportAccount = {
    airportName: string
    subUrl: string
    resetDay: number
    icon: string
    url?: string
    [key: string]: unknown
}

type AirportData = {
    expires: string
    total: number
    remain: number
}

class Widget extends WidgetBase {
    constructor(arg?: string) {
        super(arg)
        this.name = '机场流量'
        this.en = 'VpnAirportTraffic'
        this.storageExpirationMinutes = 30
        this.Run()
    }

    declare settings: {
        dataSource?: AirportAccount[]
        account?: AirportAccount
        accountSettings?: {defaultAccount?: string}
        [key: string]: unknown
    }

    // 组件传入参数
    widgetParam = args.widgetParameter

    // 订阅数据
    data: AirportData | null = null
    isRequestSuccess = false
    defaultAccountElementId: string | undefined = undefined

    // 账号信息
    account: AirportAccount = {
        airportName: 'Unknown',
        subUrl: '',
        resetDay: 1,
        icon: 'paperplane.fill'
    }

    // 动态布局数据
    iconImage: Image | null = null // 小组件Image，加载自icon_url

    // 布局数据
    commonPadding = 10

    // 组件当前设置
    currentSettings = {
        displaySettings: {
            battCircleFrontColorHex: {val: '#3E9BF7', type: this.settingValTypeString},
            battCircleBackgroundColorHex: {val: '#DDDDDD', type: this.settingValTypeString},
            battCircleBackgroundColorTransparency: {val: 0.2, type: this.settingValTypeFloat},
            battCircleTextColorHex: {val: '#FFFFFF', type: this.settingValTypeString},
        },
        accountSettings: {
            defaultAccount: {val: '请选择或者添加账号', type: this.settingValTypeString}
        }
    }

    init = async () => {
        try {
            // 重新加载设置，确保使用最新的账号配置
            await this.reloadSettingsFromStorage()
            
            // 重新初始化 this.account，确保使用最新的设置
            this.account = this.getCurrentAccount()
            
            await this.getData()
        } catch (e) {
            console.log(e)
        }
    }

    async loadBase64Img() {
        try {
            const iconSrc = this.account.icon
            if (!iconSrc) {
                this.iconImage = SFSymbol.named('paperplane.fill').image
                return
            }
            
            if (iconSrc.startsWith('http://') || iconSrc.startsWith('https://') || iconSrc.startsWith('data:image')) {
                const cacheKey = iconSrc.startsWith('data:image') ? (this.account.airportName || 'default') : null
                const iconResult = await this.storage.getImage(iconSrc, true, true, true, cacheKey)
                this.iconImage = (iconResult && typeof iconResult !== 'string') ? iconResult : null
                if (!this.iconImage) {
                    console.log('图标加载返回空值，使用默认图标')
                    this.iconImage = SFSymbol.named('paperplane.fill').image
                }
                return
            }
            
            const symbol = SFSymbol.named(iconSrc)
            this.iconImage = symbol ? symbol.image : SFSymbol.named('paperplane.fill').image
        } catch (e) {
            console.log('加载图标失败:', e)
            this.iconImage = SFSymbol.named('paperplane.fill').image
        }
    }

    async updateDefaultAccount(accountName: string) {
        this.syncCurrentSettings('accountSettings', 'defaultAccount', accountName)
        if (!this.settings.accountSettings) this.settings.accountSettings = {}
        this.settings.accountSettings.defaultAccount = accountName
        this.saveSettings(false)
    }

    // 获取当前使用的账号
    getCurrentAccount() {
        // 如果通过 widgetParam 指定了索引，使用对应的账号
        const index = typeof args.widgetParameter === 'string' ? parseInt(args.widgetParameter) : false
        if (index !== false && this.settings.dataSource && this.settings.dataSource[index]) {
            return this.settings.dataSource[index] as AirportAccount
        }
        
        // 否则使用默认账号
        if (this.settings.account) {
            return this.settings.account as AirportAccount
        }
        
        // 如果都没有，尝试从 defaultAccount 名称匹配
        const defaultAccountName = this.getDefaultAccountDisplay()
        if (defaultAccountName && defaultAccountName !== '请选择或者添加账号') {
            const dataSource = this.settings.dataSource || []
            const account = dataSource.find((acc: AirportAccount) => acc.airportName === defaultAccountName)
            if (account) {
                return account
            }
        }
        
        // 如果都没有，返回默认值
        return this.account
    }

    async getData() {
        this.isRequestSuccess = false
        const storageData = await this.storage.getStorage<AirportData>(this.account.airportName, 30)
        if (storageData) {
            console.log('[+]订阅信息请求时间间隔过小，使用缓存数据')
            this.data = storageData
            return
        }
        try {
            const req = new Request(this.account.subUrl)
            req.method = 'GET'
            req.headers = {
                'User-Agent': 'Surge iOS/5.16.2 (iPhone16,2; iOS 26.1)',
            }
            await req.load()
            const subkey = Object.keys(req.response.headers).filter(k => /SUBSCRIPTION-USERINFO/i.test(k))[0]
            const userinfo = req.response.headers[subkey]
            if (!userinfo || typeof userinfo !== 'string') {
                throw new Error('SUBSCRIPTION-USERINFO header missing')
            }
            const upload_k = Number(userinfo.match(/upload=(\d+)/)?.[1] ?? '0') / 1048576
            const download_k = Number(userinfo.match(/download=(\d+)/)?.[1] ?? '0') / 1048576
            const total_k = Number(userinfo.match(/total=(\d+)/)?.[1] ?? '0') / 1048576
            const expire_time = userinfo.match(/expire=(\d+)/)
            let expires = '无信息'
            if (expire_time) {
                expires = this.formatExpireTime(Number(expire_time[1]) * 1000)
            }
            const data: AirportData = {
                expires,
                total: total_k / 1024,
                remain: (total_k - upload_k - download_k) / 1024,
            }
            console.log('[+]订阅信息获取成功')
            this.storage.setStorage(this.account.airportName, data)
            this.data = data
            this.isRequestSuccess = true
        } catch (error) {
            console.log('[+]订阅信息获取失败，尝试使用缓存信息' + error)
            this.data = await this.storage.getStorage<AirportData>(this.account.airportName)
            if (this.data) {
                console.log('[+]使用历史缓存数据')
            } else {
                console.log('[+]无可用缓存数据')
            }
        }
        console.log(this.data)
    }

    // 生成账号列表的 HTML 内容
    generateAccountListHtml() {
        const dataSource = this.settings.dataSource || []

        // 获取默认账号名称 - 支持多种来源
        const defaultAccountName =
            this.settings.account?.airportName ||
            this.settings.accountSettings?.defaultAccount ||
            ''

        let accountListHtml = ''
        if (dataSource.length === 0) {
            accountListHtml = `
                <div class="empty-state">
                    <div class="empty-state-icon">✈️</div>
                    <div>暂无账号</div>
                    <div style="margin-top: 8px; font-size: 14px;">点击下方按钮添加您的第一个机场账号</div>
                </div>
            `
        } else {
            for (let i = 0; i < dataSource.length; i++) {
                const account = dataSource[i]
                // 使用账号名称进行比较，而不是对象引用
                const isDefault = defaultAccountName && defaultAccountName === account.airportName
                const resetDayText = account.resetDay > 0 ? '重置日: ' + account.resetDay + '号' : '无固定重置日'
                accountListHtml += `
                    <div class="account-item" data-index="${i}">
                        <div class="account-icon">✈</div>
                        <div class="account-info">
                            <div class="account-name">${account.airportName || '未命名'}</div>
                            <div class="account-detail">编号: ${i} | ${resetDayText}</div>
                        </div>
                        ${isDefault ? '<span class="account-badge">默认</span>' : ''}
                        <span class="account-arrow">›</span>
                    </div>
                `
            }
        }
        // 生成统计卡片
        let statsCardHtml = ''
        if (dataSource.length > 0) {
            statsCardHtml = `
                <div class="stats-card">
                    <div class="stats-icon">📊</div>
                    <div class="stats-info">
                        <div class="stats-title">账号统计</div>
                        <div class="stats-detail">共 ${dataSource.length} 个账号</div>
                    </div>
                </div>
            `
        }
        return {accountListHtml, statsCardHtml}
    }

    async resetPendingAction(webView: WebView) {
        try {
            await webView.evaluateJavaScript('window.pendingAction = "";', false)
        } catch (e) {
            console.log(e)
        }
    }

    async reloadSettingsFromStorage() {
        try {
            const latest = this.getSettings()
            if (latest && typeof latest === 'object') {
                this.settings = latest
            }
        } catch (e) {
            console.log(e)
        }
    }

    async updateSettingDisplay(webView: WebView, category: string, key: string, text: string) {
        if (!webView || !category || !key) return
        const elementId = `${category}__${key}`
        try {
            const scripts = `
                (function(){
                    var el = document.getElementById("${elementId}");
                    if (!el) return;
                    var desc = el.querySelector('.form-item-right-desc');
                    if (desc) {
                        var span = desc.querySelector('span') || desc.querySelector('.value-text') || desc.querySelector('.value-text-multiline');
                        if (span) span.innerText = ${JSON.stringify(text || '')};
                        var textWrapper = desc.querySelector('.text-input-wrapper');
                        if (textWrapper) {
                            textWrapper.dataset.value = ${JSON.stringify(text || '')};
                            textWrapper.dataset.default = ${JSON.stringify(text || '')};
                        }
                    }
                })();
            `
            await webView.evaluateJavaScript(scripts, false)
        } catch (e) {
            console.log('updateSettingDisplay error:', e)
        }
    }

    async bindAccountActions(webView: WebView) {
        try {
            await webView.evaluateJavaScript(
                `(function() {
                    if (typeof window.pendingAction === 'undefined') window.pendingAction = '';
                    document.querySelectorAll('.account-item').forEach(function(item) {
                        item.onclick = function() {
                            window.pendingAction = 'account_' + item.dataset.index;
                        };
                    });
                    var addBtn = document.getElementById('addBtn');
                    if (addBtn) {
                        addBtn.onclick = function() {
                            window.pendingAction = 'add';
                        };
                    }
                })()`,
                false,
            )
        } catch (e) {
            console.log('bindAccountActions error:', e)
        }
    }

    async rebuildAccountList(webView: WebView, skipReload = false) {
        try {
            // 只有在不跳过重新加载时才从存储重新加载
            if (!skipReload) {
                await this.reloadSettingsFromStorage()
            }

            const {accountListHtml, statsCardHtml} = this.generateAccountListHtml()
            const escapedHtml = accountListHtml.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
            const escapedStatsHtml = statsCardHtml.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')

            // 生成唯一时间戳强制刷新
            const timestamp = Date.now()

            await webView.evaluateJavaScript(
                `(function() {
                    try {
                        window.pendingAction = '';

                        // 更新统计卡片
                        var statsContainer = document.querySelector('.stats-container');
                        if (statsContainer) {
                            statsContainer.innerHTML = \`${escapedStatsHtml}\`;
                        }

                        // 更新账号列表
                        var body = document.querySelector('.list__body');
                        if (body) {
                            // 强制清空并刷新
                            body.innerHTML = '';
                            body.setAttribute('data-refresh', '${timestamp}');

                            // 强制重排
                            void body.offsetHeight;

                            // 设置新内容
                            body.innerHTML = \`${escapedHtml}\`;

                            // 再次强制重排
                            void body.offsetHeight;
                        }

                        return 'success';
                    } catch (err) {
                        console.log('DOM update error:', err);
                        return 'error: ' + err;
                    }
                })()`,
                false,
            )

            // 等待DOM更新完成
            await new Promise<void>(resolve => Timer.schedule(150, false, () => resolve()))

            await this.bindAccountActions(webView)
            await this.resetPendingAction(webView)
        } catch (e) {
            console.log('rebuildAccountList error:', e)
        }
    }

    async manageAccounts() {
        try {
            await this.reloadSettingsFromStorage()
            // 构建 WebView 账号管理界面
            const webView = new WebView()

            const style = `
                :root {
                    --divider-color: rgba(60,60,67,0.36);
                    --card-background: #fff;
                    --card-radius: 10px;
                    --list-header-color: rgba(60,60,67,0.6);
                }
                * {
                    -webkit-user-select: none;
                    user-select: none;
                }
                body {
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    background: #f2f2f7;
                    padding-bottom: 80px;
                }
                .header {
                    padding: 15px 18px 0;
                    color: var(--list-header-color);
                    font-size: 14px;
                    text-transform: uppercase;
                }
                .list {
                    padding: 0 18px;
                    margin-top: 15px;
                }
                .stats-container {
                    padding: 0 18px;
                    margin-top: 15px;
                }
                .stats-card {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    background: var(--card-background);
                    border-radius: var(--card-radius);
                }
                .stats-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #FF9500, #FF6B00);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    flex-shrink: 0;
                }
                .stats-info {
                    flex: 1;
                    margin-left: 12px;
                }
                .stats-title {
                    font-size: 16px;
                    font-weight: 500;
                    color: #000;
                }
                .stats-detail {
                    font-size: 12px;
                    color: #86868b;
                    margin-top: 2px;
                }
                .list__header {
                    margin: 0 0 10px 0;
                    color: var(--list-header-color);
                    font-size: 14px;
                    text-transform: uppercase;
                }
                .list__body {
                    background: var(--card-background);
                    border-radius: var(--card-radius);
                    overflow: hidden;
                }
                .account-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                    position: relative;
                    cursor: pointer;
                }
                .account-item:active {
                    background: rgba(0,0,0,0.05);
                }
                .account-item + .account-item::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 56px;
                    right: 0;
                    border-top: 0.5px solid var(--divider-color);
                }
                .account-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #3E9BF7, #00C6FB);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 20px;
                    flex-shrink: 0;
                }
                .account-info {
                    flex: 1;
                    margin-left: 12px;
                    overflow: hidden;
                }
                .account-name {
                    font-size: 16px;
                    font-weight: 500;
                    color: #000;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .account-detail {
                    font-size: 12px;
                    color: #86868b;
                    margin-top: 2px;
                }
                .account-badge {
                    background: #3E9BF7;
                    color: white;
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 8px;
                    flex-shrink: 0;
                }
                .account-arrow {
                    color: #c7c7cc;
                    font-size: 18px;
                    margin-left: 8px;
                }
                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: #86868b;
                }
                .empty-state-icon {
                    font-size: 48px;
                    margin-bottom: 12px;
                }
                .add-button-container {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 12px 18px;
                    background: #f2f2f7;
                    border-top: 0.5px solid var(--divider-color);
                }
                .add-button {
                    width: 100%;
                    padding: 14px;
                    background: #3E9BF7;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 17px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .add-button:active {
                    background: #2d7fd4;
                }
                @media (prefers-color-scheme: dark) {
                    :root {
                        --divider-color: rgba(84,84,88,0.65);
                        --card-background: #1c1c1e;
                        --list-header-color: rgba(235,235,245,0.6);
                    }
                    body {
                        background: #000;
                        color: #fff;
                    }
                    .stats-title {
                        color: #fff;
                    }
                    .account-name {
                        color: #fff;
                    }
                    .account-item:active {
                        background: rgba(255,255,255,0.1);
                    }
                    .add-button-container {
                        background: #000;
                    }
                }
            `

            const {accountListHtml, statsCardHtml} = this.generateAccountListHtml()

            const html = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, user-scalable=no">
                        <style>${style}</style>
                    </head>
                    <body>
                        <div class="header">账号管理</div>
                        <div class="stats-container">${statsCardHtml}</div>
                        <div class="list">
                            <div class="list__body">
                                ${accountListHtml}
                            </div>
                        </div>
                        <div class="add-button-container">
                            <button class="add-button" id="addBtn">+ 新增账号</button>
                        </div>
                        <script>
                            window.pendingAction = '';
                            document.querySelectorAll('.account-item').forEach((item) => {
                                item.addEventListener('click', () => {
                                    window.pendingAction = 'account_' + item.dataset.index;
                                });
                            });
                            document.getElementById('addBtn').addEventListener('click', () => {
                                window.pendingAction = 'add';
                            });
                        </script>
                    </body>
                </html>
            `

            await webView.loadHTML(html)

            // 使用标志位追踪 WebView 是否已关闭
            let isWebViewClosed = false

            // present(false) 表示以 sheet 形式展示，可以下滑关闭
            // present() 返回的 Promise 在 WebView 关闭时 resolve
            webView.present(false).then(() => {
                isWebViewClosed = true
            })

            // 循环监听用户操作
            while (!isWebViewClosed) {
                // 等待一小段时间
                await new Promise<void>(resolve => Timer.schedule(250, false, () => resolve()))

                // 再次检查，因为在等待期间可能已关闭
                if (isWebViewClosed) break

                // 检查是否有待处理的操作
                let action = ''
                try {
                    action = await webView.evaluateJavaScript(
                        `(function() {
                            if (typeof window.pendingAction === 'undefined') {
                                window.pendingAction = '';
                            }
                            var a = window.pendingAction || '';
                            window.pendingAction = '';
                            return a;
                        })()`,
                        false,
                    )
                } catch (e) {
                    // WebView 已关闭或出错，继续下一次循环
                    console.log('evaluateJavaScript 错误:', e)
                    continue
                }

                if (!action || action === '') {
                    await this.resetPendingAction(webView)
                    continue
                }

                let result = null
                if (action === 'add') {
                    result = {action: 'addAccount'}
                } else if (action.startsWith('account_')) {
                    const index = parseInt(action.replace('account_', ''))
                    result = {action: 'accountClick', index: index}
                }

                if (!result) {
                    await this.resetPendingAction(webView)
                    continue
                }

                // 获取最新的 dataSource - 先重新加载确保数据最新
                await this.reloadSettingsFromStorage()
                const dataSource = this.settings.dataSource || []

                if (result.action === 'accountClick') {
                    const index = result.index as number
                    const account = dataSource[index]
                    if (!account) continue

                    const actionAlert = new Alert()
                    actionAlert.title = account.airportName || '账号操作'
                    actionAlert.message = '请选择要执行的操作'
                    actionAlert.addAction('设为默认')
                    actionAlert.addAction('修改')
                    actionAlert.addAction('复制')
                    actionAlert.addDestructiveAction('删除')
                    actionAlert.addCancelAction('取消')

                    const actionIndex = await actionAlert.present()

                    if (actionIndex === 0) {
                        // 设为默认
                        try {
                            const accountName = account.airportName || ''

                            // 同时更新 settings.account 和 settings.accountSettings.defaultAccount
                            this.settings.account = account
                            this.syncCurrentSettings('accountSettings', 'defaultAccount', accountName)
                            if (!this.settings.accountSettings) {
                                this.settings.accountSettings = {}
                            }
                            this.settings.accountSettings.defaultAccount = accountName

                            // 保存所有设置到存储
                            this.saveSettings(false)

                            await this.rebuildAccountList(webView, true)
                            await this.resetPendingAction(webView)
                        } catch (err) {
                            console.log('设为默认错误:', err)
                        }
                    } else if (actionIndex === 1) {
                        // 修改
                        try {
                            const editResult = await this.editAccount(index, account)
                            if (editResult && editResult.success) {
                                // 原地刷新列表
                                await this.rebuildAccountList(webView)

                                if (editResult.isDefaultAccount) {
                                    await this.updateDefaultAccount(editResult.newName || '')
                                }
                                await this.resetPendingAction(webView)
                            }
                        } catch (err) {
                            console.log('修改错误:', err)
                        }
                    } else if (actionIndex === 2) {
                        // 复制
                        try {
                            const copied = await this.copyAccount(index, account)
                            if (copied) {
                                // 原地刷新列表
                                await this.rebuildAccountList(webView)
                                await this.resetPendingAction(webView)
                            }
                        } catch (err) {
                            console.log('复制错误:', err)
                        }
                    } else if (actionIndex === 3) {
                        // 删除
                        try {
                            const deleted = await this.deleteAccount(index, account)
                            if (deleted) {
                                // 原地刷新列表
                                await this.rebuildAccountList(webView)
                                await this.resetPendingAction(webView)
                            }
                        } catch (err) {
                            console.log('删除错误:', err)
                        }
                    }
                } else if (result.action === 'addAccount') {
                    // 新增账号
                    try {
                        const account = await this.setAlertInput(
                            '添加账号',
                            '添加账号数据',
                            {
                                airportName: '机场名称',
                                url: '机场链接',
                                subUrl: '订阅链接',
                                resetDay: '流量重置日期(-1代表无固定重置日期)',
                                icon: '机场图标(支持url或者base64)',
                            },
                            null,
                            false,
                        )
                        const typedAccount = account as AirportAccount | undefined
                        // 验证必填字段（icon 和 resetDay 可以为空）
                        if (typedAccount && typedAccount.airportName && (typedAccount.url || typedAccount.subUrl)) {
                            const account = typedAccount
                            account.resetDay = parseInt(String(account.resetDay)) || -1
                            // 如果没填 icon，使用默认图标
                            if (!account.icon || !account.icon.trim()) {
                                account.icon = 'paperplane.fill'
                            }
                            if (!this.settings.dataSource) this.settings.dataSource = []
                            this.settings.dataSource.push(account)
                            this.settings.dataSource = this.settings.dataSource.filter(item => item)
                            this.saveSettings()
                            // 原地刷新列表
                            await this.rebuildAccountList(webView)
                            await this.resetPendingAction(webView)
                        }
                    } catch (err) {
                        console.log('新增账号错误:', err)
                        await this.resetPendingAction(webView)
                    }
                    await this.resetPendingAction(webView)
                }
            }
        } catch (e) {
            console.log('manageAccounts 主循环错误:', e)
        }

    }

    getDefaultAccountDisplay() {
        if (this.settings.account?.airportName) return this.settings.account.airportName
        if (this.settings.accountSettings?.defaultAccount) return this.settings.accountSettings.defaultAccount
        if (this.currentSettings?.accountSettings?.defaultAccount?.val) return this.currentSettings.accountSettings.defaultAccount.val
        return '请选择或者添加账号'
    }

    async editAccount(index: number, account: AirportAccount) {
        try {
            // 手动创建 Alert 并预填充现有数据
            const alert = new Alert()
            alert.title = '修改账号'
            alert.message = '修改账号信息'

            // 添加文本输入框，使用 account 的值作为默认值
            alert.addTextField('机场名称', account.airportName || '')
            alert.addTextField('机场链接', account.url || '')
            alert.addTextField('订阅链接', account.subUrl || '')
            alert.addTextField('流量重置日期(-1代表无固定重置日期)', String(account.resetDay || ''))
            alert.addTextField('机场图标', account.icon || '')

            alert.addAction('确定')
            alert.addCancelAction('取消')

            const alertIndex = await alert.presentAlert()
            if (alertIndex === -1) return false // 用户取消

            // 获取用户输入的值
            const editedAccount: AirportAccount = {
                airportName: alert.textFieldValue(0)?.trim() || '',
                url: alert.textFieldValue(1)?.trim() || '',
                subUrl: alert.textFieldValue(2)?.trim() || '',
                resetDay: parseInt(alert.textFieldValue(3)?.trim() || '-1') || -1,
                icon: alert.textFieldValue(4)?.trim() || '',
            }

            // 验证必填字段（icon 可以为空）
            if (editedAccount.airportName && (editedAccount.url || editedAccount.subUrl)) {

                // 如果 icon 为空，使用默认图标
                if (!editedAccount.icon) {
                    editedAccount.icon = 'paperplane.fill'
                }

                const dataSource = this.settings.dataSource || []
                dataSource[index] = editedAccount
                this.settings.dataSource = dataSource

                // 如果修改的是当前默认账号，更新默认账号
                const isDefaultAccount =
                    this.settings.account && this.settings.account.airportName === account.airportName
                if (isDefaultAccount) {
                    this.settings.account = editedAccount
                }

                this.saveSettings()

                // 返回是否修改了默认账号，以便调用方更新主界面
                return {success: true, isDefaultAccount, newName: editedAccount.airportName}
            } else {
                const errorAlert = new Alert()
                errorAlert.title = '错误'
                errorAlert.message = '请填写完整的账号信息'
                errorAlert.addAction('确定')
                await errorAlert.present()
                return false
            }
        } catch (e) {
            console.log(e)
            return false
        }
    }

    async copyAccount(index: number, account: AirportAccount) {
        try {
            // 深拷贝账号对象
            const copiedAccount = {
                airportName: account.airportName + ' 副本',
                url: account.url || '',
                subUrl: account.subUrl || '',
                resetDay: account.resetDay || -1,
                icon: account.icon || '',
            }

            // 询问用户是否要修改机场名称
            const nameAlert = new Alert()
            nameAlert.title = '复制账号'
            nameAlert.message = '请输入新账号的机场名称'
            nameAlert.addTextField('机场名称', copiedAccount.airportName)
            nameAlert.addAction('确定')
            nameAlert.addCancelAction('取消')

            const nameIndex = await nameAlert.presentAlert()
            if (nameIndex === -1) {
                // 用户取消，不复制
                return false
            }

            // 使用用户输入的名称
            const newName = nameAlert.textFieldValue(0) || copiedAccount.airportName
            if (newName.trim()) {
                copiedAccount.airportName = newName.trim()
            }

            // 插入到原账号后面
            const dataSource = this.settings.dataSource || []
            dataSource.splice(index + 1, 0, copiedAccount)
            this.settings.dataSource = dataSource

            this.saveSettings()
            return true
        } catch (e) {
            console.log(e)
            return false
        }
    }

    async deleteAccount(index: number, account: AirportAccount) {
        try {
            // 二次确认
            const confirmAlert = new Alert()
            confirmAlert.title = '确认删除'
            confirmAlert.message = `确定要删除账号 "${account.airportName}" 吗？`
            confirmAlert.addDestructiveAction('删除')
            confirmAlert.addCancelAction('取消')

            const confirmIndex = await confirmAlert.present()

            if (confirmIndex === 0) {
                const dataSource = this.settings.dataSource || []
                dataSource.splice(index, 1)
                this.settings.dataSource = dataSource

                const isDefaultAccount = this.settings.account?.airportName === account.airportName
                if (isDefaultAccount) {
                    this.settings.account = undefined
                    await this.updateDefaultAccount('请选择或者添加账号')
                } else {
                    this.saveSettings(false)
                }

                return true
            }
            return false
        } catch (e) {
            console.log(e)
            return false
        }
    }

    Run() {
        try {
            this.account = this.getCurrentAccount()
            const defaultAccountDisplayValue = this.getDefaultAccountDisplay()
            if (this.currentSettings.accountSettings && this.currentSettings.accountSettings.defaultAccount) {
                this.currentSettings.accountSettings.defaultAccount.val = defaultAccountDisplayValue
            }
        } catch (error) {
            console.log(error)
        }

        if (config.runsInApp) {
            this.registerSettingCategory('displaySettings', '显示设置', [
                {
                    category: 'displaySettings',
                    title: '进度条前景颜色',
                    desc: '\n缺省值: 3E9BF7',
                    type: 'color',
                    option: {
                        battCircleFrontColorHex: (this.settings && this.settings.battCircleFrontColorHex) || '#3E9BF7',
                    },
                    icon: {name: 'wake.circle', color: '#FFCE43'},
                },
                {
                    category: 'displaySettings',
                    title: '进度条背景颜色',
                    desc: '\n缺省值: #DDDDDD',
                    type: 'color',
                    option: {
                        battCircleBackgroundColorHex:
                            (this.settings && this.settings.battCircleBackgroundColorHex) || '#DDDDDD',
                    },
                    icon: {name: 'wake.circle.fill', color: '#3285E5'},
                },
                {
                    category: 'displaySettings',
                    title: '进度条背景颜色透明度',
                    desc: '透明度值范围[0-1]\n\n缺省值: 0.2',
                    type: 'slider',
                    option: {
                        battCircleBackgroundColorTransparency:
                            (this.settings && this.settings.battCircleBackgroundColorTransparency) || 0.2,
                    },
                    icon: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/flow.png',
                    config: {
                        min: 0,
                        max: 1,
                        step: 0.01,
                    },
                },
                {
                    category: 'displaySettings',
                    title: '进度条文本颜色',
                    desc: '\n缺省值: #FFFFFF',
                    type: 'color',
                    option: {
                        battCircleTextColorHex: (this.settings && this.settings.battCircleTextColorHex) || '#FFFFFF',
                    },
                    icon: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/colorSet.png',
                },
            ])

            this.registerSetting({
                title: '参数配置',
                icon: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/setting.png',
                onAction: async () => {
                    await this.presentSettings(['basicSettings', 'displaySettings'])
                    return true
                },
            })

            // 注册账号管理设置项
            this.registerSetting({
                title: '账号管理',
                icon: {name: 'person.crop.circle.badge.plus', color: '#3E9BF7'},
                onAction: async (parentWebView) => {
                    await this.manageAccounts()
                    await this.reloadSettingsFromStorage()
                    const display = this.getDefaultAccountDisplay()
                    if (parentWebView && this.defaultAccountElementId) {
                        try {
                            await this.insertTextByElementId(parentWebView, this.defaultAccountElementId, display)
                            await this.updateSettingDisplay(parentWebView, 'actionSettings', 'defaultAccount', display)
                        } catch (e) {
                            console.log(e)
                        }
                    }
                    return true
                },
                type: 'text',
                option: {defaultAccount: this.currentSettings.accountSettings.defaultAccount.val || '请选择或者添加账号'},
            })
            // 获取元素 ID 用于更新显示
            this.defaultAccountElementId = this.getSettingElementId('actionSettings', 'defaultAccount')
        }
    }

    // ==================== 计算相关函数 ====================

    // 计算预计使用百分比
    calculatePredictUsage = (diffDays: number, resetCircle: number) => {
        return (
            (((((this.data?.total ?? 1) - (this.data?.remain ?? 0)) / (resetCircle - diffDays)) * resetCircle) / (this.data?.total ?? 1)) *
            100
        ).toFixed(2)
    }

    // 计算重置天数信息
    calculateResetDays = () => {
        let diffDays = -1
        let resetCircle = 30
        if (this.account.resetDay > 0) {
            const today = new Date()
            // 上个重置日
            const prevReset = new Date()
            prevReset.setDate(this.account.resetDay)
            // 下个重置日
            const nextReset = new Date()
            nextReset.setDate(this.account.resetDay)

            if (today.getDate() > this.account.resetDay) {
                // 今天已过本月重置日，下个重置日在下个月
                nextReset.setMonth(nextReset.getMonth() + 1)
            } else {
                // 今天还没到本月重置日，上个重置日在上个月
                prevReset.setMonth(prevReset.getMonth() - 1)
            }
            diffDays = Math.round(Math.abs((nextReset.getTime() - today.getTime()) / 86400000))
            resetCircle = Math.round(Math.abs((nextReset.getTime() - prevReset.getTime()) / 86400000))
        }
        return {diffDays, resetCircle}
    }

    // 缩放图片尺寸
    scaleImage(imageSize: Size, height: number) {
        const scale = height / imageSize.height
        return new Size(scale * imageSize.width, height)
    }

    // 格式化过期时间
    formatExpireTime(timestamp: number) {
        const nowDate = new Date(new Date().toLocaleDateString())
        const dateStart = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000).getTime()
        console.log(dateStart)
        console.log(timestamp)
        return Math.ceil((timestamp - dateStart) / (1000 * 60 * 60 * 24)) + '天'
    }

    sinDeg(deg: number) {
        return Math.sin((deg * Math.PI) / 180)
    }

    cosDeg(deg: number) {
        return Math.cos((deg * Math.PI) / 180)
    }

    // 绘制圆弧
    drawArc(ctr: Point, rad: number, w: number, deg: number, fillColor: Color, strokeColor: Color, text: string, txtColor: Color) {
        const bgx = ctr.x - rad
        const bgy = ctr.y - rad
        const bgd = 2 * rad
        const bgr = new Rect(bgx, bgy, bgd, bgd)

        const canvas = new DrawContext()
        canvas.size = new Size(canvSize, canvSize)
        canvas.opaque = false
        canvas.respectScreenScale = true

        canvas.setStrokeColor(strokeColor)
        canvas.setLineWidth(w)
        canvas.strokeEllipse(bgr)

        for (let t = 0; t < deg; t++) {
            const rect_x = ctr.x + rad * this.sinDeg(t) - w / 2
            const rect_y = ctr.y - rad * this.cosDeg(t) - w / 2
            const rect_r = new Rect(rect_x, rect_y, w, w)
            canvas.setFillColor(fillColor)
            canvas.setStrokeColor(strokeColor)
            canvas.fillEllipse(rect_r)
        }
        // attempt to draw info text
        const canvTextRect = new Rect(0, 100 - canvTextSize / 2, canvSize, canvTextSize)
        canvas.setTextAlignedCenter()
        canvas.setTextColor(txtColor)
        canvas.setFont(Font.boldSystemFont(canvTextSize))
        canvas.drawTextInRect(text, canvTextRect)
        return canvas.getImage()
    }

    // 创建进度圆环
    createBatteryArc = () => {
        const remain = this.data?.remain ?? 0
        const total = this.data?.total ?? 1
        return this.drawArc(
            new Point(canvSize / 2, canvSize / 2),
            canvRadius,
            canvWidth,
            Math.floor((remain / total) * 100 * 3.6),
            new Color(this.currentSettings.displaySettings.battCircleFrontColorHex.val),
            new Color(
                this.currentSettings.displaySettings.battCircleBackgroundColorHex.val,
                this.currentSettings.displaySettings.battCircleBackgroundColorTransparency.val,
            ),
            Math.floor((remain / total) * 100) + '%',
            new Color(this.currentSettings.displaySettings.battCircleTextColorHex.val),
        )
    }

    // ==================== 渲染相关函数 ====================

    // 渲染前的通用准备工作
    prepareRender = async () => {
        if (!this.iconImage) {
            await this.loadBase64Img()
        }
        const batteryArc = this.createBatteryArc()
        const {diffDays, resetCircle} = this.calculateResetDays()
        return {batteryArc, diffDays, resetCircle}
    }

    // 渲染底部重置信息（小尺寸）
    renderResetInfo = (diffDays: number, resetCircle: number) => {
        if (diffDays < 0) {
            return [
                h(
                    'wtext',
                    {
                        textColor: '#9D9D9D',
                        font: new Font('Chalkduster', 10),
                    },
                    '当前套餐无固定重置日期',
                ),
                h(
                    'wtext',
                    {
                        textColor: '#9D9D9D',
                        font: new Font('Chalkduster', 10),
                    },
                    '    需要手动重置.........',
                ),
            ]
        } else if (diffDays == 0) {
            return [
                h(
                    'wtext',
                    {
                        textColor: '#9D9D9D',
                        font: new Font('Chalkduster', 10),
                    },
                    '今天是您的流量重置日',
                ),
            ]
        } else {
            const predictUsage = this.calculatePredictUsage(diffDays, resetCircle)
            return [
                h(
                    'wtext',
                    {
                        textColor: '#9D9D9D',
                        font: new Font('Chalkduster', 10),
                    },
                    `流量重置剩余: ${diffDays} 天`,
                ),
                h(
                    'wtext',
                    {
                        textColor: '#9D9D9D',
                        font: new Font('Chalkduster', 10),
                    },
                    `    预计使用: ${predictUsage}%`,
                ),
            ]
        }
    }

    // 渲染底部重置信息（中尺寸）
    renderResetInfoMedium = (diffDays: number, resetCircle: number) => {
        if (diffDays < 0) {
            return [
                h(
                    'wtext',
                    {
                        textColor: '#9D9D9D',
                        font: Font.systemFont(10),
                    },
                    '当前套餐无固定重置日期',
                ),
            ]
        } else if (diffDays == 0) {
            return [
                h(
                    'wtext',
                    {
                        textColor: '#9D9D9D',
                        font: Font.systemFont(10),
                    },
                    '今天是您的流量重置日',
                ),
            ]
        } else {
            const predictUsage = this.calculatePredictUsage(diffDays, resetCircle)
            return [
                h(
                    'wtext',
                    {
                        textColor: '#9D9D9D',
                        font: new Font('Chalkduster', 10),
                    },
                    `重置剩余 ${diffDays} 天`,
                ),
                h(
                    'wtext',
                    {
                        textColor: '#9D9D9D',
                        font: new Font('Chalkduster', 10),
                    },
                    `预计使用 ${predictUsage}%`,
                ),
            ]
        }
    }

    // 小尺寸渲染
    renderSmall = async (w: ListWidget) => {
        const {batteryArc, diffDays, resetCircle} = await this.prepareRender()
        const iconSize = this.scaleImage(this.iconImage?.size ?? {width: 40, height: 40}, 40)

        // 先设置 listWidget
        GenrateView.setListWidget(w)

        // 然后构建 wbox
        return await GenrateView.wbox(
            {
                padding: [this.commonPadding, this.commonPadding, this.commonPadding, this.commonPadding],
            },
            h('wstack', {flexDirection: 'row'}, [
                h('wstack', {flexDirection: 'column'}, [
                    h('wimage', {
                        src: this.iconImage,
                        width: iconSize.width,
                        height: iconSize.height,
                        href: this.account.url ?? this.account.subUrl,
                    }),
                    h('wspacer', {}),
                    h(
                        'wtext',
                        {
                            textColor: '#AE504F',
                            font: new Font('Chalkduster', 12),
                        },
                        this.account.airportName,
                    ),
                    h('wspacer', {}),
                    h(
                        'wtext',
                        {
                            textColor: '#E9B526',
                            font: Font.systemFont(9),
                        },
                        `${(this.data?.expires ?? '')}后到期`,
                    ),
                ]),
                h('wspacer', {}),
                h('wimage', {
                    src: batteryArc,
                    width: displayArcSize,
                    height: displayArcSize,
                }),
            ]),
            h('wspacer', {}),
            h('wstack', {flexDirection: 'row'}, [
                h('wstack', {flexDirection: 'column'}, [
                    h(
                        'wtext',
                        {
                            textColor: '#3E9BF7',
                            font: Font.boldSystemFont(14),
                        },
                        `${(this.data?.remain ?? 0).toFixed(2)}G`,
                    ),
                    h(
                        'wtext',
                        {
                            textColor: '#9D9D9D',
                            font: Font.systemFont(10),
                        },
                        '剩余',
                    ),
                ]),
                h('wspacer', {}),
                h('wstack', {flexDirection: 'column'}, [
                    h(
                        'wtext',
                        {
                            textColor: this.isRequestSuccess ? this.widgetColor : Color.red(),
                            font: Font.boldSystemFont(14),
                        },
                        `${((this.data?.total ?? 1) - (this.data?.remain ?? 0)).toFixed(2)}G`,
                    ),
                    h(
                        'wtext',
                        {
                            textColor: '#9D9D9D',
                            font: Font.systemFont(10),
                        },
                        '已用',
                    ),
                ]),
            ]),
            h('wspacer', {}),
            ...this.renderResetInfo(diffDays, resetCircle),
        )
    }

    // 中尺寸渲染
    renderMedium = async (w: ListWidget) => {
        const {batteryArc, diffDays, resetCircle} = await this.prepareRender()
        const iconSize = this.scaleImage(this.iconImage?.size ?? {width: 50, height: 50}, 50)
        const mediumArcSize = 90

        // 先设置 listWidget
        GenrateView.setListWidget(w)

        // 构建中尺寸布局
        return await GenrateView.wbox(
            {
                padding: [12, 16, 12, 16],
            },
            h('wstack', {flexDirection: 'row', verticalAlign: 'center'}, [
                // 左侧：图标和基本信息
                h('wstack', {flexDirection: 'column', width: 100}, [
                    h('wimage', {
                        src: this.iconImage,
                        width: iconSize.width,
                        height: iconSize.height,
                        href: this.account.url ?? this.account.subUrl,
                    }),
                    h('wspacer', {length: 8}),
                    h(
                        'wtext',
                        {
                            textColor: '#AE504F',
                            font: new Font('Chalkduster', 14),
                        },
                        this.account.airportName,
                    ),
                    h('wspacer', {length: 4}),
                    h(
                        'wtext',
                        {
                            textColor: '#E9B526',
                            font: Font.systemFont(11),
                        },
                        `${(this.data?.expires ?? '')}后到期`,
                    ),
                ]),
                h('wspacer', {}),
                // 中间：流量统计
                h('wstack', {flexDirection: 'column', verticalAlign: 'center'}, [
                    h('wstack', {flexDirection: 'row'}, [
                        h('wstack', {flexDirection: 'column'}, [
                            h(
                                'wtext',
                                {
                                    textColor: '#3E9BF7',
                                    font: Font.boldSystemFont(18),
                                },
                                `${(this.data?.remain ?? 0).toFixed(2)}G`,
                            ),
                            h(
                                'wtext',
                                {
                                    textColor: '#9D9D9D',
                                    font: Font.systemFont(11),
                                },
                                '剩余流量',
                            ),
                        ]),
                        h('wspacer', {length: 20}),
                        h('wstack', {flexDirection: 'column'}, [
                            h(
                                'wtext',
                                {
                                    textColor: this.isRequestSuccess ? this.widgetColor : Color.red(),
                                    font: Font.boldSystemFont(18),
                                },
                                `${((this.data?.total ?? 1) - (this.data?.remain ?? 0)).toFixed(2)}G`,
                            ),
                            h(
                                'wtext',
                                {
                                    textColor: '#9D9D9D',
                                    font: Font.systemFont(11),
                                },
                                '已用流量',
                            ),
                        ]),
                    ]),
                    h('wspacer', {length: 8}),
                    ...this.renderResetInfoMedium(diffDays, resetCircle),
                ]),
                h('wspacer', {}),
                // 右侧：圆环进度
                h('wimage', {
                    src: batteryArc,
                    width: mediumArcSize,
                    height: mediumArcSize,
                }),
            ]),
        )
    }

    // 主渲染入口
    async render() {
        const widget = new ListWidget()
        await this.getWidgetBackgroundImage(widget)
        await this.init()
        if (!this.data) {
            const text = widget.addText('暂无流量数据\n该机场可能已开启阅后即焚')
            text.font = Font.systemFont(14)
            text.textColor = Color.gray()
            text.centerAlignText()
            return widget
        }
        switch (this.widgetFamily) {
            case 'small':
                await this.renderSmall(widget)
                break
            case 'medium':
                await this.renderMedium(widget)
                break
            default:
                await Utils.renderUnsupport(widget)
                break
        }
        return widget
    }
}

EndAwait(() => Runing(Widget, args.widgetParameter, false))






