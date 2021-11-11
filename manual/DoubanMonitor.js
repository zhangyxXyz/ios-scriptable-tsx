// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: film;

/*
 * author   :  yx.zhang
 * date     :  2021/10/20
 * desc     :  豆瓣电影推荐榜单, 采用了2Ya的DmYY依赖 https://github.com/dompling/Scriptable/tree/master/Scripts
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
        this.name = '豆瓣电影推荐榜单'
        this.en = 'DoubanMonitor'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter

    contentCount = 6 //自定义显示数量
    isRandomColor = true //true为开启随机颜色
    gotoType = 0 // 0 跳转到app, 1 跳转到浏览器, 选择跳转 app 时若未安装 app，则会无响应
    isShowUpdateTime = true // 是否展示更新时间
    contentRowSpacing = 5

    url = 'https://m.douban.com/rexxar/api/v2/subject_collection/movie_real_time_hotest/items?start=0&count=50&items_only=1&for_mobile=1'
    dbheader = `https://m.douban.com/pwa/cache_worker`
    defaultHeaders = {
        Accept: '*/*',
        'Content-Type': 'application/json'
    }

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
            this.registerAction(
                '数据显示配置',
                async () => {
                    await this.setAlertInput(
                        `${this.name}数据显示配置`,
                        '榜单数据显示条数|条目颜色是否随机\n条目跳转方式\n是否展示更新时间',
                        {
                            contentCount: '榜单数据显示条数',
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
                return item.uri
            case 1:
                return item.url
            default:
                return void 0
        }
    }

    renderCommon = async w => {
        if (this.httpData && this.httpData['count'] && this.httpData['count'] > 0) {
            let items = this.httpData['subject_collection_items'].splice(
                0,
                Math.min(this.contentCount, this.httpData['subject_collection_items'].length)
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
                            textColor: this.isRandomColor ? new Color(Utils.randomColor16()) : this.widgetColor,
                            font: new Font('SF Mono', 12),
                            maxLine: 1,
                            href: this.decideGoto(item)
                        },
                        `• ${gTitle}  『${value}』* ${star}✨`
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
