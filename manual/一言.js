// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: feather-alt;

/*
 * author   :  yx.zhang
 * date     :  2021/10/21
 * desc     :  一言, 采用了2Ya的DmYY依赖 https://github.com/dompling/Scriptable/tree/master/Scripts
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { DmYY, Runing } = require('./DmYY')
const { GenrateView, h } = require('./GenrateView')
const Utils = require('./Utils')

class Widget extends DmYY {
    constructor(arg) {
        super(arg)
        this.name = '一言'
        this.en = 'A Word'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter

    isRandomColor = true

    url = 'https://v1.hitokoto.cn'
    httpData = null
    isRequestSuccess = false

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
            console.log(data)
        } catch (error) {
            console.log(error)
        }
    }

    Run() {
        if (config.runsInApp) {
            this.registerAction(
                '数据显示配置',
                async () => {
                    await this.setAlertInput(`${this.name}数据显示配置`, '条目颜色是否随机', {
                        isRandomColor: '0 不随机, 1 随机'
                    })
                },
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/colorSet.png'
            )
            this.registerAction(
                '基础设置',
                this.setWidgetConfig,
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/preferences.png'
            )
        }

        try {
            const { isRandomColor } = this.settings

            this.isRandomColor = isRandomColor ? parseInt(isRandomColor) == 1 : this.isRandomColor
            this.isRandomColor = this.widgetParam ? parseInt(this.widgetParam) == 1 : this.isRandomColor
        } catch (error) {
            console.log(error)
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
                        textColor: this.isRandomColor ? Utils.randomColor16() : this.widgetColor
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
