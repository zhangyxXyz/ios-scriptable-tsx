// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: tv;

/*
 * author   :  yx.zhang
 * date     :  2021/10/20
 * desc     :  B站榜单
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
        this.name = 'B站榜单'
        this.en = 'BilibiliMonitor'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter
    contentRowSpacing = 5

    httpData = null
    isRequestSuccess = false
    // 榜单类型
    ridTypeDic = { 全站: 0, 动画: 1, 音乐: 3, 游戏: 4, 娱乐: 5, 科技: 36, 鬼畜: 119, 舞蹈: 129 }

    // 组件当前设置
    currentSettings = {
        basicSettings: {
            ridType: { val: '全站', type: this.settingValTypeString },
            urlJumpType: { val: '跳转至app', type: this.settingValTypeString }
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
            let realRidId = this.widgetParam
                ? parseInt(this.widgetParam)
                : this.ridTypeDic[this.currentSettings.basicSettings.ridType.val] || 0
            let data = await this.$request.get(`https://app.bilibili.com/x/v2/rank/region?rid=${realRidId}`)
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
                '榜单类型',
                '\n缺省值: 全站',
                { ridType: '全站' },
                { name: 'list.star', color: '#22B1EE' },
                ['全站', '动画', '音乐', '游戏', '娱乐', '科技', '鬼畜', '舞蹈']
            )
            this.registerExtraSettingsCategoryItem(
                'basicSettings',
                'menu',
                '跳转方式',
                '点击榜单条目链接跳转方式\n选择 跳转至app 时若未安装app，则会无响应\n\n缺省值: 跳转至浏览器',
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
                    await this.renderSettings(table)
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
                return `https://bilibili.com/${item.goto}${item.param}`
            case '跳转至app':
                return item.uri
            default:
                return void 0
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
        if (this.httpData && (this.httpData.code == 0 || this.httpData.code == '0')) {
            let items = this.httpData.data.splice(
                0,
                Math.min(
                    this.widgetFamily == 'medium'
                        ? this.currentSettings.displaySettings.mediaWidgetShowDataNum.val
                        : this.currentSettings.displaySettings.largeWidgetShowDataNum.val,
                    this.httpData.data.length
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
                    `💗 B站榜单`
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
