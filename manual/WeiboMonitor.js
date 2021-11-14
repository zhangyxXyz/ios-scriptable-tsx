// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: fire;

/*
 * author   :  yx.zhang
 * date     :  2021/10/19
 * desc     :  微博热搜
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { WidgetBase, Runing, GenrateView, h, Utils } = require('./zyx.Env')

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
    httpData = null
    isRequestSuccess = false

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
            isEnhancedEffect: { val: '开启', type: this.settingValTypeString },
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
            let data = await this.$request.get(this.url)
            this.httpData = data
            this.isRequestSuccess = true
            console.log(this.httpData)
        } catch (error) {
            // this.httpData = null
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
                '点击榜单条目链接跳转方式\n选择 跳转至app 时若未安装app，则会无响应\n\n缺省值: 跳转至app',
                { urlJumpType: '跳转至app' },
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
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/colorSet.png',
                ['组件文本颜色', '随机颜色']
            )
            this.registerExtraSettingsCategoryItem(
                'displaySettings',
                'text',
                '非强化模式数据间距',
                '\n缺省值：5',
                { noEnhancedModeDataSpacing: '5' },
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/height.png'
            )
            this.registerExtraSettingsCategoryItem(
                'displaySettings',
                'text',
                '强化模式数据间距',
                '\n缺省值：2',
                { enhancedModeDataSpacing: '2' },
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/height.png'
            )
            this.registerExtraSettingsCategoryItem(
                'displaySettings',
                'menu',
                '强化显示',
                '\n缺省值: 开启',
                { isEnhancedEffect: '开启' },
                { name: 'waveform.badge.plus', color: '#F269A9' },
                ['开启', '关闭']
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
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/setting.png'
            )
            this.registerAction(
                '基础设置',
                this.setWidgetConfig,
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/preferences.png'
            )
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
                        this.currentSettings.displaySettings.isEnhancedEffect.val === '开启'
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
                    if (this.currentSettings.displaySettings.isEnhancedEffect.val === '开启') {
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
