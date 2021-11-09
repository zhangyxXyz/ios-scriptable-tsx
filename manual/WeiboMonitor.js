// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: fire;

/*
 * author   :  yx.zhang
 * date     :  2021/10/19
 * desc     :  微博热搜, 采用了2Ya的DmYY依赖 https://github.com/dompling/Scriptable/tree/master/Scripts
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
        this.name = '微博热搜'
        this.en = 'WeiboMonitor'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter

    contentCount = 6 //自定义显示数量
    isRandomColor = true //true为开启随机颜色
    gotoType = 0 // 0 跳转到app, 1 跳转到浏览器, 选择跳转 app 时若未安装 app，则会无响应
    isShowUpdateTime = true // 是否展示更新时间
    url = 'https://m.weibo.cn/api/container/getIndex?containerid=106003%26filter_type%3Drealtimehot'
    contentRowSpacing = 5

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
            console.log(this.httpData)
        } catch (error) {
            // this.httpData = null
            console.log(error)
        }
    }

    Run() {
        if (config.runsInApp) {
            this.registerAction(
                '数据显示配置',
                async () => {
                    await this.setAlertInput(
                        `${this.name}数据显示配置`,
                        '热搜数据显示条数|条目颜色是否随机\n条目跳转方式\n是否展示更新时间',
                        {
                            contentCount: '热搜数据显示条数',
                            isRandomColor: '是否随机颜色, 0 不随机, 1 随机',
                            gotoType: '跳转方式 0 跳转到app, 1 跳转到浏览器',
                            isShowUpdateTime: '是否展示更新时间 0 不展示, 1 展示'
                        }
                    )
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
            const { contentCount, isRandomColor, gotoType, isShowUpdateTime } = this.settings

            this.contentCount = contentCount ? parseInt(contentCount) : this.contentCount
            this.isRandomColor = isRandomColor ? parseInt(isRandomColor) == 1 : this.isRandomColor
            this.gotoType = gotoType ? parseInt(gotoType) : this.gotoType
            this.isShowUpdateTime = isShowUpdateTime ? parseInt(isShowUpdateTime) == 1 : this.isShowUpdateTime
        } catch (error) {
            console.log(error)
        }
    }

    decideGoto(item) {
        switch (this.gotoType) {
            case 0:
                return item.scheme
            case 1:
                return item.scheme
            default:
                return void 0
        }
    }

    renderCommon = async w => {
        if (this.httpData && this.httpData.data.cards[0] && this.httpData.data.cards[0].title.indexOf('实时热点') != -1) {
            let items = this.httpData.data.cards[0]['card_group'].splice(
                0,
                Math.min(this.contentCount, this.httpData.data.cards[0]['card_group'].length)
            )
            items.map(item => {
                console.log(`• ${item.desc}`)
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
                    `🔥 微博热搜`
                ),
                items.map(item => {
                    return /* @__PURE__ */ h(
                        'wtext',
                        {
                            textColor: this.isRandomColor ? new Color(Utils.randomColor16()) : this.widgetColor,
                            font: new Font('SF Mono', 12),
                            href: this.decideGoto(item)
                        },
                        `• ${item.desc}`
                    )
                }),
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
