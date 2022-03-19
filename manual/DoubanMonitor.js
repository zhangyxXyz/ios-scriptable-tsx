// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: film;

/*
 * author   :  yx.zhang
 * date     :  2021/10/20
 * desc     :  豆瓣电影推荐榜单
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { WidgetBase, Runing, GenrateView, h, Utils } = require('./zyx.Env')

class Widget extends WidgetBase {
    constructor(arg) {
        super(arg)
        this.name = '豆瓣电影推荐榜单'
        this.en = 'DoubanMonitor'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter

    url = 'https://m.douban.com/rexxar/api/v2/subject_collection/movie_real_time_hotest/items?start=0&count=50&items_only=1&for_mobile=1'
    dbheader = `https://m.douban.com/pwa/cache_worker`
    defaultHeaders = {
        Accept: '*/*',
        'Content-Type': 'application/json'
    }
    contentRowSpacing = 5

    httpData = null
    isRequestSuccess = false

    // 组件当前设置
    currentSettings = {
        basicSettings: {
            urlJumpType: { val: '跳转至浏览器', type: this.settingValTypeString }
        },
        displaySettings: {
            mediaWidgetShowDataNum: { val: 6, type: this.settingValTypeInt },
            largeWidgetShowDataNum: { val: 15, type: this.settingValTypeInt },
            listDataColorShowType: { val: '随机颜色', type: this.settingValTypeString },
            listDataUpdateTimeShowType: { val: '显示', type: this.settingValTypeString }
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
        try {
            let data = await this.$request.get({
                url: this.url,
                headers: { Referer: this.dbheader }
            })
            this.httpData = data
            this.isRequestSuccess = true
            console.log(this.httpData)
        } catch (error) {
            console.log(error)
        }
    }

    Run() {
        if (config.runsInApp) {
            this.registerExtraSettingsCategory('basicSettings', '基础设置')
            this.registerExtraSettingsCategoryItem(
                'basicSettings',
                'menu',
                '跳转方式',
                '点击榜单条目链接跳转方式\n选择 跳转至app 时若未安装app，则会无响应\n\n缺省值: 跳转至浏览器',
                { urlJumpType: '跳转至浏览器' },
                { name: 'link', color: '#D371E3' },
                ['跳转至浏览器', '跳转至app']
            )
            this.registerExtraSettingsCategory('displaySettings', '显示设置')
            this.registerExtraSettingsCategoryItem(
                'displaySettings',
                'text',
                '中组件数据条数',
                '\n缺省值：6',
                { mediaWidgetShowDataNum: '6' },
                { name: 'number.square', color: '#5BD078' }
            )
            this.registerExtraSettingsCategoryItem(
                'displaySettings',
                'text',
                '大组件数据条数',
                '\n缺省值：15',
                { largeWidgetShowDataNum: '15' },
                { name: 'number.square', color: '#3478F6' }
            )
            this.registerExtraSettingsCategoryItem(
                'displaySettings',
                'menu',
                '数据条目颜色',
                '\n缺省值: 随机颜色',
                { listDataColorShowType: '随机颜色' },
                'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/colorSet.png',
                ['组件文本颜色', '随机颜色']
            )
            this.registerExtraSettingsCategoryItem(
                'displaySettings',
                'menu',
                '数据更新时间',
                '\n缺省值: 显示',
                { listDataUpdateTimeShowType: '显示' },
                { name: 'arrow.clockwise', color: '#D11D0C' },
                ['显示', '不显示']
            )

            this.registerAction(
                '参数配置',
                async () => {
                    const table = new UITable()
                    table.showSeparators = true
                    await this.renderExtraSettings(table)
                    await table.present()
                },
                'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/setting.png'
            )
            this.registerAction(
                '基础设置',
                this.setWidgetConfig,
                'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/preferences.png'
            )
        }
    }

    decideGoto(item) {
        switch (this.currentSettings.basicSettings.urlJumpType.val) {
            case '跳转至浏览器':
                return item.url
            case '跳转至app':
                return item.uri
            default:
                return void 0
        }
    }

    renderCommon = async w => {
        if (this.httpData && this.httpData['count'] && this.httpData['count'] > 0) {
            let items = this.httpData['subject_collection_items'].splice(
                0,
                Math.min(
                    this.widgetFamily == 'medium'
                        ? this.currentSettings.displaySettings.mediaWidgetShowDataNum.val
                        : this.currentSettings.displaySettings.largeWidgetShowDataNum.val,
                    this.httpData['subject_collection_items'].length
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
                    `🎞 豆瓣电影`
                ),
                items.map(item => {
                    let gTitle = item.title
                    let rating = item.rating
                    if (rating == null || (parseInt(rating['star_count']) <= 0 && parseInt(rating['value']) <= 0)) {
                        var star = '暂无'
                        var value = '无评分'
                    } else {
                        star = rating['star_count']
                        value = `${rating['value']}分`
                    }
                    return /* @__PURE__ */ h(
                        'wtext',
                        {
                            textColor:
                                this.currentSettings.displaySettings.listDataColorShowType.val === '随机颜色'
                                    ? new Color(Utils.randomColor16())
                                    : this.widgetColor,
                            font: new Font('SF Mono', 12),
                            maxLine: 1,
                            href: this.decideGoto(item)
                        },
                        `• ${gTitle}  『${value}』* ${star}✨`
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

    async render() {
        const widget = new ListWidget()
        await this.getWidgetBackgroundImage(widget)
        if (this.widgetFamily == 'small') {
            await Utils.renderUnsupport(widget)
        } else {
            await this.init()
            await this.renderCommon(widget)
        }
        switch (this.widgetFamily) {
            case 'small':
                widget.presentSmall()
                break
            case 'medium':
                widget.presentMedium()
                break
            case 'large':
                widget.presentLarge()
                break
            default:
                widget.presentMedium()
                break
        }
    }
}

await Runing(Widget, args.widgetParameter, false)
