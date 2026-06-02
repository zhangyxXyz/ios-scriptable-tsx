// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: globe-asia;

/*
 * author   :  seiun
 * date     :  2025/12/25
 * desc     :  聚合热榜
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { WidgetBase, Runing, GenrateView, h, Utils } = require('./Seiun.Env')

class Widget extends WidgetBase {
    constructor(arg) {
        super(arg)
        this.name = '聚合热榜'
        this.en = 'HotlistMonitor'
        this.storageExpirationMinutes = 5
        this.Run()
    }

    widgetParam = args.widgetParameter
    contentRowSpacing = 5

    httpData = null
    isRequestSuccess = false

    hotTypeOptions = [
        { label: '百度热搜', value: 'baidu' },
        { label: '知乎热榜', value: 'zhihu' },
        { label: '微博热榜', value: 'weibo' },
        { label: 'b站热榜', value: 'bilihot' },
        { label: 'b站全站日榜', value: 'biliall' },
        { label: '抖音热榜', value: 'douyin' },
        { label: '历史上的今天', value: 'history' },
        { label: '少数派热榜', value: 'sspai' },
        { label: '36氪热榜', value: 'k36' },
        { label: '虎扑网热帖', value: 'hupu' },
        { label: '今日头条热点', value: 'toutiao' },
        { label: '虫部落最新热门帖', value: 'chongBluo' },
        { label: '澎湃新闻热榜', value: 'pengPai' },
    ]

    get hotTypeLabelMap() {
        const map = {}
        this.hotTypeOptions.forEach(option => {
            map[option.value] = option.label
        })
        return map
    }

    currentSettings = {
        basicSettings: {
            apiKey: { val: '', type: this.settingValTypeString },
            hotType: { val: 'history', type: this.settingValTypeString }
        },
        displaySettings: {
            mediaWidgetShowDataNum: { val: 6, type: this.settingValTypeInt },
            largeWidgetShowDataNum: { val: 15, type: this.settingValTypeInt },
            listDataColorShowType: { val: '随机颜色', type: this.settingValTypeString },
            showTitleDate: { val: true, type: this.settingValTypeBool },
            listDataUpdateTimeShowType: { val: '显示', type: this.settingValTypeString },
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
        const apiKey = this.currentSettings.basicSettings.apiKey.val
        if (!apiKey) {
            console.log('API Key 未设置')
            return
        }
        const hotType = this.currentSettings.basicSettings.hotType.val || 'history'
        const cacheKey = `hotlist_${hotType}`
        
        const storageData = this.storage.getStorage(cacheKey, this.storageExpirationMinutes)
        if (storageData) {
            console.log('[+]请求间隔时间过小，使用缓存数据')
            this.httpData = storageData
            this.isRequestSuccess = storageData && storageData.code === 200
            return
        }
        
        this.isRequestSuccess = false
        try {
            const url = `https://www.52api.cn/api/hotlist?key=${encodeURIComponent(apiKey)}&hot=${encodeURIComponent(hotType)}`
            
            const data = await this.$request.get(url, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset:utf-8;',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
                }
            })
            console.log('[+]数据请求成功：' + url)
            this.storage.setStorage(cacheKey, data)
            this.httpData = data
            this.isRequestSuccess = data && data.code === 200
            console.log(this.httpData)
        } catch (error) {
            console.log(`[+]getData出错，尝试使用缓存数据：${error}`)
            this.httpData = this.storage.getStorage(cacheKey)
        }
    }

    Run() {
        if (config.runsInApp) {
            this.registerSettingCategory('basicSettings', '基础设置', [
                {
                    title: 'API密钥',
                    desc: '52api密钥，在控制台->密钥管理查看',
                    icon: { name: 'key', color: '#FF6B6B' },
                    type: 'password',
                    option: {
                        apiKey: '',
                    },
                    config: {
                        placeholder: '请输入API密钥'
                    },
                },
                {
                    title: '热榜类型',
                    desc: '缺省值: 历史上的今天\n可前往 https://www.52api.cn/doc/47 查看是否有新类型可添加',
                    icon: { name: 'flame', color: '#FF9500' },
                    type: 'select',
                    option: {
                        hotType: 'history',
                    },
                    config: {
                        selectOptions: this.hotTypeOptions,
                        defaultShowContent: '历史上的今天',
                        multiple: false,
                        editable: true
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
                    title: '标题显示日期',
                    desc: '缺省值: 开启',
                    icon: { name: 'calendar', color: '#34C759' },
                    type: 'switch',
                    option: {
                        showTitleDate: true,
                    },
                },
                {
                    title: '数据更新时间',
                    desc: '缺省值: 显示',
                    icon: { name: 'arrow.clockwise', color: '#D11D0C' },
                    type: 'select',
                    option: {
                        listDataUpdateTimeShowType: '显示',
                    },
                    config: {
                        selectOptions: [
                            { label: '显示', value: '显示' },
                            { label: '不显示', value: '不显示' },
                        ],
                        defaultShowContent: '显示',
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
        }
    }

    renderCommon = async w => {
        if (this.httpData && this.httpData.code === 200 && this.httpData.data && this.httpData.data.data) {
            const items = this.httpData.data.data.slice(
                0,
                Math.min(
                    this.widgetFamily == 'medium'
                        ? this.currentSettings.displaySettings.mediaWidgetShowDataNum.val
                        : this.currentSettings.displaySettings.largeWidgetShowDataNum.val,
                    this.httpData.data.data.length
                )
            )
            items.map(item => {
                console.log(`• ${item.title}`)
            })

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
                    'wtext',
                    {
                        textColor: this.widgetColor,
                        font: new Font('SF Mono', 15),
                        opacity: 0.7
                    },
                    (() => {
                        const hotType = this.currentSettings.basicSettings.hotType.val || 'history'
                        const label = this.hotTypeLabelMap[hotType] || '聚合热榜'
                        let title = `🔥 ${label}`
                        if (this.currentSettings.displaySettings.showTitleDate.val && this.httpData.data.update_time) {
                            const dateStr = this.httpData.data.update_time.split(' ')[0]
                            title += ` • ${dateStr}`
                        }
                        return title
                    })()
                ),
                items.map(item => {
                    const itemColor = this.currentSettings.displaySettings.listDataColorShowType.val === '随机颜色'
                        ? new Color(Utils.randomColor16())
                        : this.widgetColor
                    return /* @__PURE__ */ h(
                        'wstack',
                        {
                            verticalAlign: 'center',
                            href: item.mobilUrl || item.url
                        },
                        h(
                            'wtext',
                            {
                                textColor: itemColor,
                                font: Font.mediumSystemFont(12),
                                maxLine: 1
                            },
                            `• ${item.title}`
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

