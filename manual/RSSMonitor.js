// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: rss;

/*
 * author   :  seiun
 * date     :  2021/10/19
 * desc     :  RSS监视器
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { WidgetBase, Runing, GenrateView, h, Utils } = require('./Seiun.Env')

class Widget extends WidgetBase {
    constructor(arg) {
        super(arg)
        this.name = 'RSS监视器'
        this.en = 'RSSMonitor'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter

    rsslink = 'https://github.com/zhangyxXyz/ios-scriptable-tsx/commits/master.atom'
    contentRowSpacing = 5

    rssData = null
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
            let data = await this.$request.get('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(this.rsslink))
            this.rssData = data
            this.isRequestSuccess = true
            console.log(this.rssData)
        } catch (error) {
            // this.rssData = null
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

        try {
            this.rsslink = this.widgetParam ? this.widgetParam : this.rsslink
        } catch (error) {
            console.log(error)
        }
    }

    decideGoto(item) {
        switch (this.currentSettings.basicSettings.urlJumpType.val) {
            case '跳转至浏览器':
                return item.link
            case '跳转至app':
                return void 0 //`github://${item.target.id}`;
            default:
                return void 0
        }
    }

    renderCommon = async w => {
        if (this.rssData && this.rssData.status == 'ok') {
            let items = this.rssData.items.splice(
                0,
                Math.min(
                    this.widgetFamily == 'medium'
                        ? this.currentSettings.displaySettings.mediaWidgetShowDataNum.val
                        : this.currentSettings.displaySettings.largeWidgetShowDataNum.val,
                    this.rssData.items.length
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
                    `📻 ${this.rssData.feed.title}`
                ),
                items.map(item => {
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
                        `• ${item.title}`
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
