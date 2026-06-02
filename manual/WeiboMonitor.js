// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: fire;

/*
 * author   :  seiun
 * date     :  2021/10/19
 * desc     :  微博热搜
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { WidgetBase, Runing, GenrateView, h, Utils } = require('./Seiun.Env')

class Widget extends WidgetBase {
    constructor(arg) {
        super(arg)
        this.name = '微博热搜'
        this.en = 'WeiboMonitor'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter

    url = 'https://m.weibo.cn/api/container/getIndex?containerid=106003%26filter_type%3Drealtimehot'
    isRequestSuccess = false
    
    getHeaders() {
        return {
            'Referer': 'https://m.weibo.cn',
            'Accept-Language': 'zh-CN,zh;q=0.9',
        }
    }

    // 组件当前设置
    currentSettings = {
        basicSettings: {
            urlJumpType: { val: '跳转至app', type: this.settingValTypeString }
        },
        displaySettings: {
            mediaWidgetShowDataNum: { val: 6, type: this.settingValTypeInt },
            largeWidgetShowDataNum: { val: 15, type: this.settingValTypeInt },
            enhancedModeDataSpacing: { val: 2, type: this.settingValTypeInt },
            noEnhancedModeDataSpacing: { val: 5, type: this.settingValTypeInt },
            isEnhancedEffect: { val: true, type: this.settingValTypeBool },
            listDataColorShowType: { val: '随机颜色', type: this.settingValTypeString },
            listDataUpdateTimeShowType: { val: true, type: this.settingValTypeBool }
        }
    }

    init = async () => {
        try {
            await this.getData()
        } catch (e) {
            console.log(e)
        }
    }

    async getData() {
        this.isRequestSuccess = false
        const headers = this.getHeaders()
        
        try {
            let data = await this.$request.get(this.url, { headers })
            if (data && data.data && data.data.cards !== undefined) {
                this.httpData = data
                this.isRequestSuccess = true
                this.storage.setStorage('weiboData', this.httpData)
                console.log('[+]数据获取成功')
                return
            }
        } catch (e) {
            console.log('[+]直接请求失败，启用WebView验证')
        }
        
        try {
            const webView = new WebView()
            await webView.loadURL(this.url)
            
            let jsonText = null
            let attempts = 0
            const maxAttempts = 20
            
            while (attempts < maxAttempts && !jsonText) {
                await new Promise(resolve => Timer.schedule(800, false, resolve))
                attempts++
                
                try {
                    const currentUrl = await webView.evaluateJavaScript('window.location.href')
                    if (currentUrl && currentUrl.includes('containerid=106003')) {
                        const pageText = await webView.evaluateJavaScript('document.body.innerText || document.body.textContent')
                        if (pageText && pageText.trim().startsWith('{')) {
                            const testData = JSON.parse(pageText)
                            if (testData.data && testData.data.cards) {
                                jsonText = pageText
                                break
                            }
                        }
                    }
                } catch (e) {}
            }
            
            if (jsonText) {
                this.httpData = JSON.parse(jsonText)
                this.isRequestSuccess = true
                this.storage.setStorage('weiboData', this.httpData)
                console.log('[+]WebView验证成功')
            } else {
                console.log('[+]WebView超时，尝试最后请求')
                try {
                    const data = await this.$request.get(this.url, { headers })
                    if (data && data.data && data.data.cards !== undefined) {
                        this.httpData = data
                        this.isRequestSuccess = true
                        this.storage.setStorage('weiboData', this.httpData)
                        console.log('[+]最后请求成功')
                    }
                } catch (e) {}
                
                if (!this.httpData) {
                    const cached = this.storage.getStorage('weiboData')
                    if (cached) {
                        this.httpData = cached
                        console.log('[+]使用缓存数据')
                    } else {
                        console.log('[+]获取失败且无缓存')
                    }
                }
            }
        } catch (error) {
            const cached = this.storage.getStorage('weiboData')
            if (cached) {
                this.httpData = cached
                console.log('[+]异常，使用缓存数据')
            } else {
                console.log('[+]获取失败')
            }
        }
    }

    Run() {
        if (config.runsInApp) {
            this.registerSettingCategory('basicSettings', '基础设置', [
                {
                    title: '跳转方式',
                    desc: '点击榜单条目链接跳转方式\n选择 跳转至app 时若未安装app，则会无响应\n\n缺省值: 跳转至app',
                    icon: { name: 'link', color: '#D371E3' },
                    type: 'select',
                    option: {
                        urlJumpType: '跳转至app',
                    },
                    config: {
                        selectOptions: [
                            { label: '跳转至浏览器', value: '跳转至浏览器' },
                            { label: '跳转至app', value: '跳转至app' },
                        ],
                        defaultShowContent: '跳转至app',
                        multiple: false,
                    },
                },
            ])

            this.registerSettingCategory('displaySettings', '显示设置', [
                {
                    title: '中组件数据条数',
                    desc: '缺省值：6',
                    icon: { name: 'number.square', color: '#5BD078' },
                    type: 'text',
                    option: {
                        mediaWidgetShowDataNum: '6',
                    },
                },
                {
                    title: '大组件数据条数',
                    desc: '缺省值：15',
                    icon: { name: 'number.square', color: '#3478F6' },
                    type: 'text',
                    option: {
                        largeWidgetShowDataNum: '15',
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
                            { label: '组件文本颜色', value: '组件文本颜色' },
                            { label: '随机颜色', value: '随机颜色' },
                        ],
                        defaultShowContent: '随机颜色',
                        multiple: false,
                    },
                },
                {
                    title: '非详细模式数据间距',
                    desc: '缺省值：5',
                    icon: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/height.png',
                    type: 'text',
                    option: {
                        noEnhancedModeDataSpacing: '5',
                    },
                },
                {
                    title: '详细模式数据间距',
                    desc: '缺省值：2',
                    icon: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/height.png',
                    type: 'text',
                    option: {
                        enhancedModeDataSpacing: '2',
                    },
                },
                {
                    title: '详细模式',
                    desc: '缺省值: 开启',
                    icon: { name: 'waveform.badge.plus', color: '#F269A9' },
                    type: 'switch',
                    option: {
                        isEnhancedEffect: true,
                    },
                },
                {
                    title: '数据更新时间',
                    desc: '缺省值: 显示',
                    icon: { name: 'arrow.clockwise', color: '#D11D0C' },
                    type: 'switch',
                    option: {
                        listDataUpdateTimeShowType: true,
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
        }
    }

    decideGoto(item) {
        switch (this.currentSettings.basicSettings.urlJumpType.val) {
            case '跳转至浏览器':
                return item.scheme
            case '跳转至app':
                return item.scheme
            default:
                return void 0
        }
    }

    renderCommon = async w => {
        if (this.httpData && this.httpData.data.cards[0] && this.httpData.data.cards[0].title.indexOf('实时热点') != -1) {
            // 剔除第一条
            let items = this.httpData['data']['cards'][0]['card_group'].splice(
                1,
                Math.min(
                    this.widgetFamily == 'medium'
                        ? this.currentSettings.displaySettings.mediaWidgetShowDataNum.val
                        : this.currentSettings.displaySettings.largeWidgetShowDataNum.val,
                    this.httpData['data']['cards'][0]['card_group'].length - 1
                )
            )
            items.map(item => {
                console.log(`• ${item.desc}`)
            })

            GenrateView.setListWidget(w)
            return /* @__PURE__ */ h(
                'wbox',
                {
                    spacing:
                        this.currentSettings.displaySettings.isEnhancedEffect.val
                            ? this.currentSettings.displaySettings.enhancedModeDataSpacing.val
                            : this.currentSettings.displaySettings.noEnhancedModeDataSpacing.val
                },
                /* @__PURE__ */ h('wspacer', {
                    length: 5
                }),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        textColor: this.widgetColor,
                        font: new Font('SF Mono', 15),
                        opacity: 0.7
                    },
                    `🔥 微博热搜`
                ),
                items.map(item => {
                    if (this.currentSettings.displaySettings.isEnhancedEffect.val) {
                        return /* @__PURE__ */ h(
                            'wstack',
                            {
                                verticalAlign: 'center',
                                href: this.decideGoto(item)
                            },
                            /* @__PURE__ */ h('wimage', {
                                src: item['pic'],
                                width: 18,
                                height: 18
                            }),
                            /* @__PURE__ */ h('wspacer', {
                                length: 5
                            }),
                            /* @__PURE__ */ h(
                                'wtext',
                                {
                                    textColor:
                                        this.currentSettings.displaySettings.listDataColorShowType.val === '随机颜色'
                                            ? new Color(Utils.randomColor16())
                                            : this.widgetColor,
                                    font: Font.lightSystemFont(13),
                                    textAlign: 'left',
                                    maxLine: 1
                                },
                                item['desc']
                            ),
                            /* @__PURE__ */ h('wspacer', {
                                length: 5
                            }),
                            item['icon'] &&
                                /* @__PURE__ */ h('wimage', {
                                    src: item['icon'],
                                    width: 18,
                                    height: 18
                                }),
                            /* @__PURE__ */ h('wspacer', null),
                            /* @__PURE__ */ h(
                                'wtext',
                                {
                                    font: Font.lightSystemFont(12),
                                    textColor: this.widgetColor,
                                    opacity: 0.6
                                },
                                item['desc_extr']
                            )
                        )
                    } else {
                        return /* @__PURE__ */ h(
                            'wtext',
                            {
                                textColor:
                                    this.currentSettings.displaySettings.listDataColorShowType.val === '随机颜色'
                                        ? new Color(Utils.randomColor16())
                                        : this.widgetColor,
                                font: new Font('SF Mono', 12),
                                href: this.decideGoto(item)
                            },
                            `• ${item.desc}`
                        )
                    }
                }),
                this.currentSettings.displaySettings.listDataUpdateTimeShowType.val &&
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

await Runing(Widget, args.widgetParameter, false)
