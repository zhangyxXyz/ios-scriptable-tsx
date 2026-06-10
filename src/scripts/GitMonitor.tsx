// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: code-branch;

import type {SeiunEnv} from '@app/env/types'

declare const importModule: (moduleName: string) => SeiunEnv

const dependencyFileName = 'Seiun.Env.js'
const runtimeRequire = typeof require === 'undefined' ? importModule : require
const { WidgetBase, Runing, GenrateView, h, Utils } = runtimeRequire(dependencyFileName) as SeiunEnv

class Widget extends WidgetBase {
    constructor(arg) {
        super(arg)
        this.name = 'Git监控'
        this.en = 'GitMonitor'
        this.Run()
    }

    widgetParam = args.widgetParameter

    contentRowSpacing = 5

    commits = null
    isRequestSuccess = false
    
    repo = {
        repoUrl: 'https://github.com/zhangyxXyz/ios-scriptable',
        branch: '',
        token: '',
        repoType: 'github'
    }

    currentSettings = {
        basicSettings: {
            defaultGithubToken: { val: '', type: this.settingValTypeString },
            defaultGitlabToken: { val: '', type: this.settingValTypeString }
        },
        displaySettings: {
            mediaWidgetShowDataNum: { val: 6, type: this.settingValTypeInt },
            largeWidgetShowDataNum: { val: 15, type: this.settingValTypeInt },
            listDataColorShowType: { val: '随机颜色', type: this.settingValTypeString },
            listDataUpdateTimeShowType: { val: '显示', type: this.settingValTypeString },
            urlJumpType: { val: '跳转至浏览器', type: this.settingValTypeString }
        },
        repoSettings: {
            defaultRepo: { val: '请选择或者添加仓库', type: this.settingValTypeString }
        }
    }

    // 获取当前使用的仓库
    getCurrentRepo() {
        // 如果通过 widgetParam 指定了索引，使用对应的仓库
        const index = typeof args.widgetParameter === 'string' ? parseInt(args.widgetParameter) : false
        if (index !== false && this.settings.dataSource && this.settings.dataSource[index]) {
            return this.settings.dataSource[index]
        }
        
        // 否则使用默认仓库
        if (this.settings.repo) {
            return this.settings.repo
        }
        
        // 如果都没有，尝试从 defaultRepo 名称匹配
        const defaultRepoUrl = this.getDefaultRepoDisplay()
        if (defaultRepoUrl && defaultRepoUrl !== '请选择或者添加仓库') {
            const dataSource = this.settings.dataSource || []
            const repo = dataSource.find(r => r.repoUrl === defaultRepoUrl)
            if (repo) {
                return repo
            }
        }
        
        // 如果都没有，返回默认值
        return this.repo
    }

    init = async () => {
        try {
            // 重新加载设置，确保使用最新的仓库配置
            await this.reloadSettingsFromStorage()
            
            // 重新初始化 this.repo，确保使用最新的设置
            this.repo = this.getCurrentRepo()
            
            await this.getData()
        } catch (e) {
            console.log(e)
        }
    }

    parseRepoUrl(url) {
        const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (githubMatch) {
            return {
                type: 'github',
                owner: githubMatch[1],
                repo: githubMatch[2].replace(/\.git$/, '')
            }
        }
        
        const gitlabMatch = url.match(/(?:https?:\/\/)?([^\/:]+(?::\d+)?)\/([^\/]+)\/([^\/]+)/);
        if (gitlabMatch) {
            const domain = gitlabMatch[1].replace(/^https?:\/\//, '');
            const namespace = gitlabMatch[2];
            const project = gitlabMatch[3].replace(/\.git$/, '');
            
            return {
                type: 'gitlab',
                domain: domain,
                namespace: namespace,
                project: project
            }
        }
        
        return null
    }

    async getData() {
        this.isRequestSuccess = false
        try {
            const repoUrl = this.repo.repoUrl
            const repoInfo = this.parseRepoUrl(repoUrl)
            if (!repoInfo) {
                throw new Error('无效的仓库地址')
            }

            let apiUrl
            const headers = {}
            const branch = this.repo.branch
            const repoType = this.repo.repoType || repoInfo.type

            if (repoType === 'github') {
                apiUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits`
                if (branch) {
                    apiUrl += `?sha=${encodeURIComponent(branch)}`
                }
                const token = this.repo.token || this.currentSettings.basicSettings.defaultGithubToken.val
                if (token) {
                    headers['Authorization'] = `token ${token}`
                }
            } else if (repoType === 'gitlab') {
                let baseUrl
                if (repoInfo.domain === 'gitlab.com') {
                    baseUrl = 'https://gitlab.com'
                } else {
                    baseUrl = `https://${repoInfo.domain}`
                }
                const projectPath = encodeURIComponent(`${repoInfo.namespace}/${repoInfo.project}`)
                apiUrl = `${baseUrl}/api/v4/projects/${projectPath}/repository/commits`
                if (branch) {
                    apiUrl += `?ref_name=${encodeURIComponent(branch)}`
                }
                const token = this.repo.token || this.currentSettings.basicSettings.defaultGitlabToken.val
                if (token) {
                    headers['PRIVATE-TOKEN'] = token
                }
            }

            const data = await this.$request.get(apiUrl, { headers })
            this.commits = data
            this.isRequestSuccess = true
            console.log(`获取到 ${this.commits.length} 条提交记录`)
        } catch (error) {
            console.log(error)
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

    async updateSettingDisplay(webView, category, key, text) {
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

    generateRepoListHtml() {
        const dataSource = this.settings.dataSource || []
        const defaultRepoName = this.settings.repoSettings?.defaultRepo || this.settings.repo?.repoUrl || ''
        
        let repoListHtml = ''
        if (dataSource.length === 0) {
            repoListHtml = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <div>暂无仓库</div>
                    <div style="margin-top: 8px; font-size: 14px;">点击下方按钮添加您的第一个仓库</div>
                </div>
            `
        } else {
            for (let i = 0; i < dataSource.length; i++) {
                const repo = dataSource[i]
                const isDefault = defaultRepoName && defaultRepoName === repo.repoUrl
                const branchText = repo.branch ? `分支: ${repo.branch}` : '默认分支'
                const typeText = repo.repoType === 'github' ? 'GitHub' : 'GitLab'
                repoListHtml += `
                    <div class="account-item" data-index="${i}">
                        <div class="account-icon">📦</div>
                        <div class="account-info">
                            <div class="account-name">${repo.repoUrl || '未命名'}</div>
                            <div class="account-detail">${typeText} | ${branchText}</div>
                        </div>
                        ${isDefault ? '<span class="account-badge">默认</span>' : ''}
                        <span class="account-arrow">›</span>
                    </div>
                `
            }
        }
        
        let statsCardHtml = ''
        if (dataSource.length > 0) {
            statsCardHtml = `
                <div class="stats-card">
                    <div class="stats-icon">📊</div>
                    <div class="stats-info">
                        <div class="stats-title">仓库统计</div>
                        <div class="stats-detail">共 ${dataSource.length} 个仓库</div>
                    </div>
                </div>
            `
        }
        return {repoListHtml, statsCardHtml}
    }

    async resetPendingAction(webView) {
        try {
            await webView.evaluateJavaScript('window.pendingAction = "";', false)
        } catch (e) {
            console.log(e)
        }
    }

    async bindRepoActions(webView) {
        try {
            await webView.evaluateJavaScript(
                `(function() {
                    if (typeof window.pendingAction === 'undefined') window.pendingAction = '';
                    document.querySelectorAll('.account-item').forEach(function(item) {
                        item.onclick = function() {
                            window.pendingAction = 'repo_' + item.dataset.index;
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
            console.log('bindRepoActions error:', e)
        }
    }

    async rebuildRepoList(webView, skipReload = false) {
        try {
            if (!skipReload) {
                await this.reloadSettingsFromStorage()
            }

            const {repoListHtml, statsCardHtml} = this.generateRepoListHtml()
            const escapedHtml = repoListHtml.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
            const escapedStatsHtml = statsCardHtml.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
            const timestamp = Date.now()

            await webView.evaluateJavaScript(
                `(function() {
                    try {
                        window.pendingAction = '';
                        var statsContainer = document.querySelector('.stats-container');
                        if (statsContainer) {
                            statsContainer.innerHTML = \`${escapedStatsHtml}\`;
                        }
                        var body = document.querySelector('.list__body');
                        if (body) {
                            body.innerHTML = '';
                            body.setAttribute('data-refresh', '${timestamp}');
                            void body.offsetHeight;
                            body.innerHTML = \`${escapedHtml}\`;
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

            await new Promise(resolve => Timer.schedule(150, false, resolve))
            await this.bindRepoActions(webView)
            await this.resetPendingAction(webView)
        } catch (e) {
            console.log('rebuildRepoList error:', e)
        }
    }

    async manageRepos() {
        try {
            await this.reloadSettingsFromStorage()
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

            const {repoListHtml, statsCardHtml} = this.generateRepoListHtml()

            const html = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, user-scalable=no">
                        <style>${style}</style>
                    </head>
                    <body>
                        <div class="header">仓库管理</div>
                        <div class="stats-container">${statsCardHtml}</div>
                        <div class="list">
                            <div class="list__body">
                                ${repoListHtml}
                            </div>
                        </div>
                        <div class="add-button-container">
                            <button class="add-button" id="addBtn">+ 新增仓库</button>
                        </div>
                        <script>
                            window.pendingAction = '';
                            document.querySelectorAll('.account-item').forEach((item) => {
                                item.addEventListener('click', () => {
                                    window.pendingAction = 'repo_' + item.dataset.index;
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
            let isWebViewClosed = false
            webView.present(false).then(() => {
                isWebViewClosed = true
            })

            while (!isWebViewClosed) {
                await new Promise(resolve => Timer.schedule(250, false, resolve))
                if (isWebViewClosed) break

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
                    console.log('evaluateJavaScript 错误:', e)
                    continue
                }

                if (!action || action === '') {
                    await this.resetPendingAction(webView)
                    continue
                }

                let result = null
                if (action === 'add') {
                    result = {action: 'addRepo'}
                } else if (action.startsWith('repo_')) {
                    const index = parseInt(action.replace('repo_', ''))
                    result = {action: 'repoClick', index: index}
                }

                if (!result) {
                    await this.resetPendingAction(webView)
                    continue
                }

                await this.reloadSettingsFromStorage()
                const dataSource = this.settings.dataSource || []

                if (result.action === 'repoClick') {
                    const index = result.index
                    const repo = dataSource[index]
                    if (!repo) continue

                    const actionAlert = new Alert()
                    actionAlert.title = repo.repoUrl || '仓库操作'
                    actionAlert.message = '请选择要执行的操作'
                    actionAlert.addAction('设为默认')
                    actionAlert.addAction('修改')
                    actionAlert.addAction('复制')
                    actionAlert.addDestructiveAction('删除')
                    actionAlert.addCancelAction('取消')

                    const actionIndex = await actionAlert.present()

                    if (actionIndex === 0) {
                        try {
                            const repoUrl = repo.repoUrl || ''
                            this.settings.repo = repo
                            if (!this.settings.repoSettings) {
                                this.settings.repoSettings = {}
                            }
                            this.settings.repoSettings.defaultRepo = repoUrl
                            this.saveSettings(false)
                            this.syncCurrentSettings('repoSettings', 'defaultRepo', repoUrl)
                            await this.rebuildRepoList(webView, true)
                            await this.resetPendingAction(webView)
                        } catch (err) {
                            console.log('设为默认错误:', err)
                        }
                    } else if (actionIndex === 1) {
                        try {
                            const editResult = await this.editRepo(index, repo)
                            if (editResult && editResult.success) {
                                await this.rebuildRepoList(webView)
                                if (editResult.isDefaultRepo) {
                                    await this.updateDefaultRepo(editResult.newUrl || '')
                                }
                                await this.resetPendingAction(webView)
                            }
                        } catch (err) {
                            console.log('修改错误:', err)
                        }
                    } else if (actionIndex === 2) {
                        try {
                            const copied = await this.copyRepo(index, repo)
                            if (copied) {
                                await this.rebuildRepoList(webView)
                                await this.resetPendingAction(webView)
                            }
                        } catch (err) {
                            console.log('复制错误:', err)
                        }
                    } else if (actionIndex === 3) {
                        try {
                            const deleted = await this.deleteRepo(index, repo)
                            if (deleted) {
                                await this.rebuildRepoList(webView)
                                await this.resetPendingAction(webView)
                            }
                        } catch (err) {
                            console.log('删除错误:', err)
                        }
                    }
                } else if (result.action === 'addRepo') {
                    try {
                        const repo = await this.setAlertInput(
                            '添加仓库',
                            '添加仓库数据',
                            {
                                repoUrl: '仓库地址',
                                branch: '分支名称（可选）',
                                token: 'Token（可选）',
                                repoType: '仓库类型（github/gitlab，可选，不填自动检测）',
                            },
                            null,
                            false,
                        )
                        if (repo && repo.repoUrl) {
                            if (!repo.repoType || !repo.repoType.trim()) {
                                const repoInfo = this.parseRepoUrl(repo.repoUrl)
                                repo.repoType = repoInfo ? repoInfo.type : 'github'
                            } else {
                                repo.repoType = repo.repoType.trim()
                            }
                            if (!this.settings.dataSource) this.settings.dataSource = []
                            this.settings.dataSource.push(repo)
                            this.settings.dataSource = this.settings.dataSource.filter(item => item)
                            this.saveSettings()
                            await this.rebuildRepoList(webView)
                            await this.resetPendingAction(webView)
                        }
                    } catch (err) {
                        console.log('新增仓库错误:', err)
                        await this.resetPendingAction(webView)
                    }
                }
            }
        } catch (e) {
            console.log('manageRepos 主循环错误:', e)
        }
    }

    async updateDefaultRepo(repoUrl) {
        this.syncCurrentSettings('repoSettings', 'defaultRepo', repoUrl)
        if (!this.settings.repoSettings) this.settings.repoSettings = {}
        this.settings.repoSettings.defaultRepo = repoUrl
        this.saveSettings(false)
    }

    getDefaultRepoDisplay() {
        if (this.settings.repo?.repoUrl) return this.settings.repo.repoUrl
        if (this.settings.repoSettings?.defaultRepo) return this.settings.repoSettings.defaultRepo
        if (this.currentSettings?.repoSettings?.defaultRepo?.val) return this.currentSettings.repoSettings.defaultRepo.val
        return '请选择或者添加仓库'
    }

    async editRepo(index, repo) {
        try {
            const alert = new Alert()
            alert.title = '修改仓库'
            alert.message = '修改仓库信息'
            alert.addTextField('仓库地址', repo.repoUrl || '')
            alert.addTextField('分支名称（可选）', repo.branch || '')
            alert.addTextField('Token（可选）', repo.token || '')
            alert.addTextField('仓库类型（github/gitlab，可选，不填自动检测）', repo.repoType || '')
            alert.addAction('确定')
            alert.addCancelAction('取消')

            const alertIndex = await alert.presentAlert()
            if (alertIndex === -1) return false

            const editedRepo = {
                repoUrl: alert.textFieldValue(0)?.trim() || '',
                branch: alert.textFieldValue(1)?.trim() || '',
                token: alert.textFieldValue(2)?.trim() || '',
                repoType: alert.textFieldValue(3)?.trim() || '',
            }

            if (editedRepo.repoUrl) {
                if (!editedRepo.repoType) {
                    const repoInfo = this.parseRepoUrl(editedRepo.repoUrl)
                    editedRepo.repoType = repoInfo ? repoInfo.type : 'github'
                }

                const dataSource = this.settings.dataSource || []
                dataSource[index] = editedRepo
                this.settings.dataSource = dataSource

                const isDefaultRepo = this.settings.repo && this.settings.repo.repoUrl === repo.repoUrl
                if (isDefaultRepo) {
                    this.settings.repo = editedRepo
                }

                this.saveSettings()
                return {success: true, isDefaultRepo, newUrl: editedRepo.repoUrl}
            } else {
                const errorAlert = new Alert()
                errorAlert.title = '错误'
                errorAlert.message = '请填写仓库地址'
                errorAlert.addAction('确定')
                await errorAlert.present()
                return false
            }
        } catch (e) {
            console.log(e)
            return false
        }
    }

    async copyRepo(index, repo) {
        try {
            const copiedRepo = {
                repoUrl: repo.repoUrl + ' 副本',
                branch: repo.branch || '',
                token: repo.token || '',
                repoType: repo.repoType || 'github',
            }

            const nameAlert = new Alert()
            nameAlert.title = '复制仓库'
            nameAlert.message = '请输入新仓库的地址'
            nameAlert.addTextField('仓库地址', copiedRepo.repoUrl)
            nameAlert.addAction('确定')
            nameAlert.addCancelAction('取消')

            const nameIndex = await nameAlert.presentAlert()
            if (nameIndex === -1) {
                return false
            }

            const newUrl = nameAlert.textFieldValue(0) || copiedRepo.repoUrl
            if (newUrl.trim()) {
                copiedRepo.repoUrl = newUrl.trim()
            }

            const dataSource = this.settings.dataSource || []
            dataSource.splice(index + 1, 0, copiedRepo)
            this.settings.dataSource = dataSource

            this.saveSettings()
            return true
        } catch (e) {
            console.log(e)
            return false
        }
    }

    async deleteRepo(index, repo) {
        try {
            const confirmAlert = new Alert()
            confirmAlert.title = '确认删除'
            confirmAlert.message = `确定要删除仓库 "${repo.repoUrl}" 吗？`
            confirmAlert.addDestructiveAction('删除')
            confirmAlert.addCancelAction('取消')

            const confirmIndex = await confirmAlert.present()

            if (confirmIndex === 0) {
                const dataSource = this.settings.dataSource || []
                dataSource.splice(index, 1)
                this.settings.dataSource = dataSource

                const isDefaultRepo = this.settings.repo?.repoUrl === repo.repoUrl
                if (isDefaultRepo) {
                    this.settings.repo = null
                    await this.updateDefaultRepo('请选择或者添加仓库')
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
            this.repo = this.getCurrentRepo()

            const defaultRepoDisplayValue = this.getDefaultRepoDisplay()
            if (this.currentSettings.repoSettings && this.currentSettings.repoSettings.defaultRepo) {
                this.currentSettings.repoSettings.defaultRepo.val = defaultRepoDisplayValue
            }
        } catch (error) {
            console.log(error)
        }

        if (config.runsInApp) {
            this.registerSettingCategory('basicSettings', '默认Token', [
                {
                    title: 'GitHub',
                    desc: 'GitHub API Token，用于提高请求限额\nPublic仓库可不填，未认证60次/小时，认证后5000次/小时\n\n缺省值：空',
                    icon: {name: 'key', color: '#FF9500'},
                    type: 'password',
                    option: {
                        defaultGithubToken: this.currentSettings.basicSettings.defaultGithubToken.val || '',
                    },
                    config: {
                        placeholder: 'ghp_xxxxxxxxxxxx',
                        style: 'compact',
                        truncateLength: -1,
                    },
                },
                {
                    title: 'GitLab',
                    desc: 'GitLab API Token (PRIVATE-TOKEN)\n用于访问私有仓库或提高请求限额\n\n缺省值：空',
                    icon: {name: 'key.fill', color: '#FC6D26'},
                    type: 'password',
                    option: {
                        defaultGitlabToken: this.currentSettings.basicSettings.defaultGitlabToken.val || '',
                    },
                    config: {
                        placeholder: 'glpat-xxxxxxxxxxxx',
                        style: 'compact',
                        truncateLength: -1,
                    },
                },
            ])

            this.registerSettingCategory('displaySettings', '显示设置', [
                {
                    title: '中组件数据条数',
                    desc: '缺省值：6',
                    icon: {name: 'number.square', color: '#5BD078'},
                    type: 'text',
                    option: {
                        mediaWidgetShowDataNum: '6',
                    },
                    config: {
                        placeholder: '6',
                        style: 'compact',
                    },
                },
                {
                    title: '大组件数据条数',
                    desc: '缺省值：15',
                    icon: {name: 'number.square', color: '#3478F6'},
                    type: 'text',
                    option: {
                        largeWidgetShowDataNum: '15',
                    },
                    config: {
                        placeholder: '15',
                        style: 'compact',
                    },
                },
                {
                    title: '数据条目颜色',
                    desc: '缺省值: 随机颜色',
                    icon: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/colorSet.png',
                    type: 'select',
                    option: {
                        listDataColorShowType: '随机颜色',
                    },
                    config: {
                        selectOptions: [
                            {label: '组件文本颜色', value: '组件文本颜色'},
                            {label: '随机颜色', value: '随机颜色'},
                        ],
                        defaultShowContent: '随机颜色',
                        multiple: false,
                    },
                },
                {
                    title: '数据更新时间',
                    desc: '缺省值: 显示',
                    icon: {name: 'arrow.clockwise', color: '#D11D0C'},
                    type: 'select',
                    option: {
                        listDataUpdateTimeShowType: '显示',
                    },
                    config: {
                        selectOptions: [
                            {label: '显示', value: '显示'},
                            {label: '不显示', value: '不显示'},
                        ],
                        defaultShowContent: '显示',
                        multiple: false,
                    },
                },
                {
                    title: '跳转方式',
                    desc: '点击提交条目链接跳转方式\n选择 跳转至app 时若未安装app，则会无响应\n\n缺省值: 跳转至浏览器',
                    icon: {name: 'arrow.up.forward.app', color: '#D371E3'},
                    type: 'select',
                    option: {
                        urlJumpType: this.currentSettings.displaySettings.urlJumpType.val || '跳转至浏览器',
                    },
                    config: {
                        selectOptions: [
                            {label: '跳转至浏览器', value: '跳转至浏览器'},
                            {label: '跳转至app', value: '跳转至app'},
                        ],
                        defaultShowContent: '跳转至浏览器',
                        multiple: false,
                    },
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

            this.registerSetting({
                title: '仓库管理',
                icon: {name: 'folder.badge.plus', color: '#3E9BF7'},
                onAction: async (parentWebView) => {
                    await this.manageRepos()
                    await this.reloadSettingsFromStorage()
                    const display = this.getDefaultRepoDisplay()
                    if (parentWebView && this.defaultRepoElementId) {
                        try {
                            await this.insertTextByElementId(parentWebView, this.defaultRepoElementId, display)
                            await this.updateSettingDisplay(parentWebView, 'actionSettings', 'defaultRepo', display)
                        } catch (e) {
                            console.log(e)
                        }
                    }
                    return true
                },
                type: 'text',
                option: {defaultRepo: this.currentSettings.repoSettings.defaultRepo.val || '请选择或者添加仓库'},
                config: {
                    style: 'compact',
                    truncateLength: -1,
                },
            })
            this.defaultRepoElementId = this.getSettingElementId('actionSettings', 'defaultRepo')
        }
    }

    decideGoto(commit) {
        switch (this.currentSettings.displaySettings.urlJumpType.val) {
            case '跳转至浏览器': {
                if (commit.html_url) {
                    return commit.html_url
                }
                const repoUrl = this.repo.repoUrl
                const repoInfo = this.parseRepoUrl(repoUrl)
                if (repoInfo && (repoInfo.type === 'gitlab' || this.repo.repoType === 'gitlab')) {
                    let baseUrl
                    if (repoInfo.domain === 'gitlab.com') {
                        baseUrl = 'https://gitlab.com'
                    } else {
                        baseUrl = `https://${repoInfo.domain}`
                    }
                    const commitId = commit.id || commit.sha
                    return `${baseUrl}/${repoInfo.namespace}/${repoInfo.project}/-/commit/${commitId}`
                }
                return commit.html_url || void 0
            }
            case '跳转至app':
                return void 0
            default:
                return void 0
        }
    }

    renderCommon = async w => {
        if (this.commits && this.commits.length > 0) {
            const items = this.commits.slice(
                0,
                Math.min(
                    this.widgetFamily == 'medium'
                        ? this.currentSettings.displaySettings.mediaWidgetShowDataNum.val
                        : this.currentSettings.displaySettings.largeWidgetShowDataNum.val,
                    this.commits.length
                )
            )
            items.map(item => {
                const message = item.commit ? item.commit.message : item.message
                console.log(`• ${message ? message.split('\n')[0] : '无消息'}`)
            })

            const repoUrl = this.repo.repoUrl
            const repoInfo = this.parseRepoUrl(repoUrl)
            let repoName = 'Git'
            if (repoInfo) {
                const repoType = this.repo.repoType || repoInfo.type
                if (repoType === 'github') {
                    repoName = `${repoInfo.owner}/${repoInfo.repo}`
                } else if (repoType === 'gitlab') {
                    repoName = `${repoInfo.namespace}/${repoInfo.project}`
                }
            }
            const branch = this.repo.branch

            GenrateView.setListWidget(w)
            
            return /* @__PURE__ */ h(
                'wbox',
                {
                    spacing: this.contentRowSpacing
                },
                /* @__PURE__ */ h('wspacer', {
                    length: this.contentRowSpacing
                }),
                /* @__PURE__ */ h(
                    'wstack',
                    {
                        verticalAlign: 'center'
                    },
                    /* @__PURE__ */ h('wimage', {
                        src: 'chevron.left.forwardslash.chevron.right',
                        width: 14,
                        height: 14,
                        filter: this.widgetColor,
                        opacity: 0.7
                    }),
                    /* @__PURE__ */ h('wspacer', {
                        length: 6
                    }),
                    branch && /* @__PURE__ */ h(
                        'wtext',
                        {
                            textColor: new Color('#FF6B6B'),
                            font: new Font('Chalkduster', 13),
                            opacity: 0.9
                        },
                        branch
                    ),
                    branch && /* @__PURE__ */ h(
                        'wtext',
                        {
                            textColor: this.widgetColor,
                            font: new Font('SF Mono', 12),
                            opacity: 0.7
                        },
                        '@'
                    ),
                    /* @__PURE__ */ h(
                        'wtext',
                        {
                            textColor: this.widgetColor,
                            font: new Font('SF Mono', 12),
                            opacity: 0.7
                        },
                        repoName
                    )
                ),
                items.map(item => {
                    const message = (item.commit ? item.commit.message : item.message || '').split('\n')[0]
                    const shortSha = (item.sha || item.id || '').substring(0, 7)
                    const colorType = this.paramColorType !== null 
                        ? (this.paramColorType === '0' ? '组件文本颜色' : '随机颜色')
                        : this.currentSettings.displaySettings.listDataColorShowType.val
                    const itemColor = colorType === '随机颜色'
                        ? new Color(Utils.randomColor16())
                        : this.widgetColor
                    
                    let authorName = ''
                    if (item.commit && item.commit.author) {
                        authorName = item.commit.author.name || ''
                    } else if (item.author) {
                        authorName = item.author.name || item.author.login || item.author_name || ''
                    } else if (item.author_name) {
                        authorName = item.author_name
                    }
                    
                    return /* @__PURE__ */ h(
                        'wstack',
                        {
                            verticalAlign: 'center',
                            href: this.decideGoto(item)
                        },
                        h(
                            'wtext',
                            {
                                textColor: itemColor,
                                font: Font.mediumSystemFont(12),
                                lineLimit: 1
                            },
                            `• ${shortSha} › ${message}`
                        ),
                        h('wspacer'),
                        authorName && h(
                            'wtext',
                            {
                                textColor: itemColor,
                                font: Font.systemFont(10),
                                opacity: 0.6
                            },
                            authorName
                        )
                    )
                }),
                this.currentSettings.displaySettings.listDataUpdateTimeShowType.val === '显示' &&
                    /* @__PURE__ */ h(
                        'wstack',
                        {
                            verticalAlign: 'center',
                            padding: [0, 0, 5, 0]
                        },
                        /* @__PURE__ */ h('wspacer', null),
                        /* @__PURE__ */ h('wimage', {
                            src: 'arrow.clockwise',
                            width: 10,
                            height: 10,
                            filter: this.widgetColor,
                            opacity: 0.5
                        }),
                        /* @__PURE__ */ h('wspacer', {
                            length: 5
                        }),
                        /* @__PURE__ */ h(
                            'wtext',
                            {
                                textColor: this.isRequestSuccess ? this.widgetColor : Color.red(),
                                font: new Font('SF Mono', 10),
                                textAlign: 'right',
                                opacity: 0.5
                            },
                            Utils.time('HH:mm:ss')
                        )
                    )
            )
        } else {
            GenrateView.setListWidget(w)
            return /* @__PURE__ */ h(
                'wbox',
                {
                    spacing: this.contentRowSpacing
                },
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        textColor: Color.red(),
                        font: new Font('SF Mono', 14),
                        opacity: 0.7
                    },
                    '数据加载失败'
                )
            )
        }
    }

    renderMedium = async (w) => {
        return await this.renderCommon(w)
    }

    renderLarge = async (w) => {
        return await this.renderCommon(w)
    }

    async render() {
        const widget = new ListWidget()
        await this.getWidgetBackgroundImage(widget)
        await this.init()
        switch (this.widgetFamily) {
            case 'medium':
                await this.renderMedium(widget)
                break
            case 'large':
                await this.renderLarge(widget)
                break
            default:
                await Utils.renderUnsupport(widget)
                break
        }
        return widget
    }
}

EndAwait(() => Runing(Widget, args.widgetParameter, false))
