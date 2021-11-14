// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: feather-alt;

/*
 * author   :  yx.zhang
 * date     :  2021/10/21
 * desc     :  一言
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { WidgetBase, Runing, GenrateView, h, Utils } = require('./zyx.Env')

class Widget extends WidgetBase {
    constructor(arg) {
        super(arg)
        this.name = '一言'
        this.en = 'A Word'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter
    splitWidgetParam = []

    httpData = null
    isRequestSuccess = false

    // 组件当前设置
    currentSettings = {
        basicSettings: {
            filterTypeString: { val: '', type: this.settingValTypeString }
        },
        displaySettings: {
            listDataColorShowType: { val: '随机颜色', type: this.settingValTypeString }
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
            let args = 'abcdefghijkl'
            let types =
                (this.splitWidgetParam.length >= 2
                    ? this.splitWidgetParam[1]
                    : this.currentSettings.basicSettings.filterTypeString.val || ''
                )
                    .split('')
                    .filter(c => args.indexOf(c) > -1)
                    .map(c => `c=${c}`)
                    .join('&') || ''
            types = Utils.isEmpty(types) ? '' : `?${types}`
            let url = `https://v1.hitokoto.cn/${types}`
            console.log(url)
            let data = await this.$request.get(url)
            this.httpData = data
            this.isRequestSuccess = true
            console.log(data)
        } catch (error) {
            console.log(error)
        }
    }

    Run() {
        if (config.runsInApp) {
            this.registerExtraSettingsCategory('basicSettings', '基础设置')
            this.registerExtraSettingsCategoryItem(
                'basicSettings',
                'text',
                '分类',
                '填写对应分类字母(可组合多个)\n留空代表全分类\n\na ==> 动画\nb ==> 漫画\nc ==> 游戏\nd ==> 文学\ne ==> 原创\nf ==> 来自网络\ng ==> 其他\nh ==> 影视\ni ==> 诗词\nj ==> 网易云\nk ==> 哲学\nl ==> 抖机灵\n缺省值: 全分类',
                { filterTypeString: '' },
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/flow.png'
            )
            this.registerExtraSettingsCategory('displaySettings', '显示设置')
            this.registerExtraSettingsCategoryItem(
                'displaySettings',
                'menu',
                '数据条目颜色',
                '\n缺省值: 随机颜色',
                { listDataColorShowType: '随机颜色' },
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/colorSet.png',
                ['组件文本颜色', '随机颜色']
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
        try {
            if (this.widgetParam) {
                this.splitWidgetParam = this.widgetParam.split(',')
            }
        } catch (e) {
            console.log(e)
        }
    }

    renderCommon = async w => {
        if (this.httpData) {
            const { hitokoto = '', from = '' } = this.httpData
            GenrateView.setListWidget(w)
            return /* @__PURE__ */ h(
                'wbox',
                {
                    background: this.backGroundColor
                },
                /* @__PURE__ */ h(
                    'wstack',
                    {
                        verticalAlign: 'center'
                    },
                    /* @__PURE__ */ h('wimage', {
                        src: 'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Application/OneWord.png',
                        width: 14,
                        height: 14,
                        borderRadius: 4
                    }),
                    /* @__PURE__ */ h('wspacer', {
                        length: 10
                    }),
                    /* @__PURE__ */ h(
                        'wtext',
                        {
                            opacity: 0.7,
                            font: Font.boldSystemFont(12),
                            textColor: this.widgetColor
                        },
                        '一言'
                    )
                ),
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        font: Font.lightSystemFont(16),
                        textColor: (
                            this.splitWidgetParam.length >= 1
                                ? parseInt(this.splitWidgetParam[0]) === 1
                                : this.currentSettings.displaySettings.listDataColorShowType.val === '随机颜色'
                        )
                            ? Utils.randomColor16()
                            : this.widgetColor
                        /* onClick: () => this.render(),*/
                    },
                    hitokoto
                ),
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        font: Font.lightSystemFont(12),
                        textColor: this.widgetColor,
                        opacity: 0.5,
                        textAlign: 'right',
                        maxLine: 1
                    },
                    from
                )
            )
        } else {
            if (!this.isRequestSuccess) {
                GenrateView.setListWidget(w)
            }
        }
        return w
    }

    async render() {
        await this.init()
        const widget = new ListWidget()
        await this.getWidgetBackgroundImage(widget)
        await this.renderCommon(widget)

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
                widget.presentSmall()
                break
        }
    }
}

await Runing(Widget, args.widgetParameter, false)
