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
const { WidgetBase, Runing, GenrateView, h, Utils, Storage } = require('./zyx.Env')
const storage = new Storage('OneWord')

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
        let storageWord = storage.getStorage('word', 1)
        if (storageWord) {
            console.log('[+]请求间隔时间过小，使用缓存数据')
            this.httpData = storageWord
        } else {
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
                let data = await this.$request.get(url)
                console.log('[+]数据请求成功：' + url)
                storage.setStorage('word', data)
                this.httpData = data
                this.isRequestSuccess = true
            } catch (err) {
                console.log(`[+]getData出错，尝试使用缓存数据：${err}`)
                this.httpData = storage.getStorage('word')
            }
        }
        console.log(this.httpData)
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
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settingsflow.png',
                [],
                '全分类'
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
                        /* src: 'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Application/OneWord.png', */
                        src: 'data:image/png;base64,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',
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
