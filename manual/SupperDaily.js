// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: calendar-alt;

/*
 * author   :  yx.zhang
 * date     :  2021/10/18
 * desc     :  日期助手
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { WidgetBase, Runing, Utils } = require('./zyx.Env')

class Widget extends WidgetBase {
    constructor(arg) {
        super(arg)
        this.name = '日期助手'
        this.en = 'SupperDaily'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter

    // 布局数据
    commonPadding = 10
    init = async () => {
        try {
            await this.getData()
        } catch (e) {
            console.log(e)
        }
    }

    async getData() {
        // do noting
    }

    Run() {
        if (config.runsInApp) {
            this.registerAction(
                '基础设置',
                this.setWidgetConfig,
                'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/preferences.png'
            )
        }
    }

    isFriday() {
        let day = new Date().getDay()
        if (day === 5) {
            return true
        } else {
            return false
        }
    }

    renderCommon = async w => {
        w.setPadding(this.commonPadding, this.commonPadding, this.commonPadding, this.commonPadding)
        const q = '今天是周五吗？'
        let question = w.addText(q)
        question.font = Font.boldSystemFont(18)
        question.textColor = this.widgetColor

        if (this.isFriday()) {
            let answer = w.addText('是😏')
            answer.font = Font.boldSystemFont(60)
            answer.textColor = new Color('#F79709')
        } else {
            let answer = w.addText('不是😶')
            answer.font = Font.boldSystemFont(40)
            answer.textColor = this.widgetColor
        }
        return w
    }

    async render() {
        const widget = new ListWidget()
        await this.getWidgetBackgroundImage(widget)
        if (this.widgetFamily != 'small') {
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
                widget.presentSmall()
                break
        }
    }
}

await Runing(Widget, args.widgetParameter, false)
