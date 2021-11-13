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
const { WidgetBase, Runing, GenrateView, h } = require('./zyx.Env')
const Utils = require('./Utils')

class Widget extends WidgetBase {
    constructor(arg) {
        super(arg)
        this.name = '一言'
        this.en = 'A Word'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter
    url = 'https://v1.hitokoto.cn'
    httpData = null
    isRequestSuccess = false

    // 组件当前设置
    currentSettings = {
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
                '显示设置',
                async () => {
                    const table = new UITable()
                    table.showSeparators = true
                    await this.renderSettings(table)
                    await table.present()
                },
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/colorSet.png'
            )
            this.registerAction(
                '基础设置',
                this.setWidgetConfig,
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/preferences.png'
            )
        }
    }

    async renderSettings(table) {
        var renderCustomHeader = function () {
            table.removeAllRows()
            let resetHeader = new UITableRow()
            let resetHeading = resetHeader.addText('重置设置')
            resetHeading.titleFont = Font.mediumSystemFont(17)
            resetHeading.centerAligned()
            table.addRow(resetHeader)
            let resetRow = new UITableRow()
            let resetRowText = resetRow.addText('重置设置参数', '设置参数绑定脚本文件名，请勿随意更改脚本文件名')
            resetRowText.titleFont = Font.systemFont(16)
            resetRowText.subtitleFont = Font.systemFont(12)
            resetRowText.subtitleColor = new Color('999999')
            resetRow.dismissOnSelect = false
            resetRow.onSelect = async () => {
                const options = ['取消', '重置']
                const message = '本菜单里的所有设置参数将会重置为默认值，重置后请重新打开设置菜单'
                const index = await this.generateAlert(message, options)
                if (index === 0) return
                for (const category of Object.keys(this.currentSettings)) {
                    if (category === this.noneCategoryName) {
                        continue
                    }
                    delete this.settings[category]
                }
                this.saveSettings()
                await this.renderSettings(table)
            }
            table.addRow(resetRow)
        }
        this.renderExtraSettings(table, renderCustomHeader)
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
                            this.widgetParam
                                ? parseInt(this.widgetParam) === 1
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
