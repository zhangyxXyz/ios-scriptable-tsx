// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: tv;

/*
 * author   :  yx.zhang
 * date     :  2021/10/20
 * desc     :  B站榜单, 采用了2Ya的DmYY依赖 https://github.com/dompling/Scriptable/tree/master/Scripts
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { DmYY, Runing } = require('./DmYY')
const Utils = require('./Utils')

class Widget extends DmYY {
    constructor(arg) {
        super(arg)
        this.name = 'B站榜单'
        this.en = 'BilibiliMonitor'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter

    contentCount = 6 //自定义显示数量
    isRandomColor = true //true为开启随机颜色
    gotoType = 0 // 0 跳转到app, 1 跳转到浏览器, 选择跳转 app 时若未安装 app，则会无响应
    isShowUpdateTime = true // 是否展示更新时间

    rid = 0 //rid对应不同的B站榜单：0全站，1动画，3音乐，4游戏，5娱乐，36科技，119鬼畜，129舞蹈。
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
            let data = await this.$request.get(`https://app.bilibili.com/x/v2/rank/region?rid=${this.rid}`)
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
                        '榜单分类 0全站，1动画，3音乐\n4游戏，5娱乐，36科技\n119鬼畜，129舞蹈\n榜单数据显示条数|条目颜色是否随机\n条目跳转方式\n是否展示更新时间',
                        {
                            rid: '榜单分类',
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
            const { rid, contentCount, isRandomColor, gotoType, isShowUpdateTime } = this.settings

            this.rid = rid ? parseInt(rid) : this.rid
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
                return `https://bilibili.com/${item.goto}${item.param}`
            default:
                return void 0
        }
    }

    addTextToListWidget(text, url, listWidget) {
        const stackItem = listWidget.addStack()
        if (url) {
            stackItem.url = url
        }

        let item = stackItem.addText(text)
        if (this.isRandomColor == true) {
            item.textColor = new Color(Utils.randomColor16())
        } else {
            item.textColor = this.widgetColor
        }
        item.font = new Font('SF Mono', 12)
    }

    renderCommon = async w => {
        if (this.httpData && (this.httpData.code == 0 || this.httpData.code == '0')) {
            let group = this.httpData.data
            let items = []
            for (let i = 0; i < this.contentCount && i < group.length; i++) {
                let item = group[i].title
                items.push(item)
            }
            console.log(items)

            w.addSpacer()
            w.spacing = this.contentRowSpacing

            const firstLine = w.addText(`💗 B站榜单`)
            firstLine.font = new Font('SF Mono', 15)
            firstLine.textColor = this.widgetColor
            firstLine.textOpacity = 0.7

            for (let i = 0; i < items.length; i++) {
                this.addTextToListWidget(`• ${items[i]}`, this.decideGoto(group[i]), w)
            }

            if (this.isShowUpdateTime) {
                const updateTimeItem = w.addStack()
                updateTimeItem.centerAlignContent()
                updateTimeItem.spacing = this.contentRowSpacing
                updateTimeItem.addSpacer(Device.screenSize().width - 160)
                const updateTimeImg = updateTimeItem.addImage(SFSymbol.named('arrow.clockwise').image)
                updateTimeImg.imageSize = new Size(10, 10)
                updateTimeImg.tintColor = this.widgetColor
                updateTimeImg.imageOpacity = 0.5
                const updateTimeText = updateTimeItem.addText(Utils.time('HH:mm:ss'))
                updateTimeText.font = new Font('SF Mono', 10)
                updateTimeText.textColor = this.isRequestSuccess ? this.widgetColor : Color.red()
                updateTimeText.textOpacity = 0.5
            }

            w.addSpacer()
            w.spacing = this.contentRowSpacing
            return w
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
