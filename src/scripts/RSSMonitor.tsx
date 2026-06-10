// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: rss;

/*
 * author   :  seiun
 * date     :  2021/10/19
 * desc     :  RSS监视器
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable
 * changelog:
 */

import type {SeiunEnv} from '@app/env/types'

declare const importModule: (moduleName: string) => SeiunEnv

const dependencyFileName = 'Seiun.Env.js'
const runtimeRequire = typeof require === 'undefined' ? importModule : require
const { WidgetBase, Runing, GenrateView, h, Utils } = runtimeRequire(dependencyFileName) as SeiunEnv

type RssItem = {title: string; link: string; [key: string]: unknown}
type RssData = {status: string; items: RssItem[]; feed: {title: string; [key: string]: unknown}}

class Widget extends WidgetBase {
    constructor(arg?: string) {
        super(arg)
        this.name = 'RSS监视器'
        this.en = 'RSSMonitor'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter

    rsslink = 'https://github.com/zhangyxXyz/ios-scriptable/commits/master.atom'
    contentRowSpacing = 5

    rssData: RssData | null = null
    isRequestSuccess = false

    // 组件当前设置
    currentSettings = {
        basicSettings: {
            urlJumpType: { val: '跳转至浏览器', type: this.settingValTypeString }
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
            const data = await this.$request.get<RssData>('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(this.rsslink))
            this.rssData = data
            this.isRequestSuccess = true
            console.log(this.rssData)
        } catch (error) {
            // this.rssData = null
            console.log(error)
        }
    }

    Run() {
        if (config.runsInApp) {
            this.registerSettingCategory('basicSettings', '基础设置', [
                {
                    title: '跳转方式',
                    desc: '点击榜单条目链接跳转方式\n选择 跳转至app 时若未安装app，则会无响应\n\n缺省值: 跳转至浏览器',
                    icon: {name: 'arrow.up.forward.app', color: '#D371E3'},
                    type: 'select',
                    option: {
                        urlJumpType: '跳转至浏览器',
                    },
                    config: {
                        selectOptions: [
                            {label: '跳转至浏览器', value: '跳转至浏览器'},
                            {label: '跳转至app', value: '跳转至app'},
                        ],
                        defaultShowContent: '跳转至浏览器',
                        multiple: false,
                    },
                },
            ])

            this.registerSettingCategory('displaySettings', '显示设置', [
                {
                    title: '中组件数据条数',
                    desc: '缺省值：6',
                    icon: {name: 'number.square', color: '#5BD078'},
                    type: 'text',
                    option: {
                        mediaWidgetShowDataNum: '6',
                    },
                    config: {
                        placeholder: '6',
                        style: 'compact',
                    },
                },
                {
                    title: '大组件数据条数',
                    desc: '缺省值：15',
                    icon: {name: 'number.square', color: '#3478F6'},
                    type: 'text',
                    option: {
                        largeWidgetShowDataNum: '15',
                    },
                    config: {
                        placeholder: '15',
                        style: 'compact',
                    },
                },
                {
                    title: '数据条目颜色',
                    desc: '缺省值: 随机颜色',
                    icon: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/colorSet.png',
                    type: 'select',
                    option: {
                        listDataColorShowType: '随机颜色',
                    },
                    config: {
                        selectOptions: [
                            {label: '组件文本颜色', value: '组件文本颜色'},
                            {label: '随机颜色', value: '随机颜色'},
                        ],
                        defaultShowContent: '随机颜色',
                        multiple: false,
                    },
                },
                {
                    title: '数据更新时间',
                    desc: '缺省值: 显示',
                    icon: {name: 'arrow.clockwise', color: '#D11D0C'},
                    type: 'select',
                    option: {
                        listDataUpdateTimeShowType: '显示',
                    },
                    config: {
                        selectOptions: [
                            {label: '显示', value: '显示'},
                            {label: '不显示', value: '不显示'},
                        ],
                        defaultShowContent: '显示',
                        multiple: false,
                    },
                },
            ])

            this.registerSetting({
                title: '参数配置',
                icon: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/setting.png',
                onAction: async () => {
                    await this.presentSettings(['basicSettings', 'displaySettings'])
                    return true
                },
            })
        }

        try {
            this.rsslink = this.widgetParam ? this.widgetParam : this.rsslink
        } catch (error) {
            console.log(error)
        }
    }

    decideGoto(item: RssItem) {
        switch (this.currentSettings.basicSettings.urlJumpType.val) {
            case '跳转至浏览器':
                return item.link
            case '跳转至app':
                return void 0 //`github://${item.target.id}`;
            default:
                return void 0
        }
    }

    renderCommon = async (w: ListWidget) => {
        if (this.rssData && this.rssData.status == 'ok') {
            const items = this.rssData.items.splice(
                0,
                Math.min(
                    this.widgetFamily == 'medium'
                        ? this.currentSettings.displaySettings.mediaWidgetShowDataNum.val
                        : this.currentSettings.displaySettings.largeWidgetShowDataNum.val,
                    this.rssData.items.length
                )
            )
            items.map((item: RssItem) => {
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
                    `📻 ${this.rssData.feed.title}`
                ),
                items.map((item: RssItem) => {
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
                        /* @__PURE__ */ h('wspacer', {}),
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
        } else {
            GenrateView.setListWidget(w)
            return /* @__PURE__ */ h(
                'wbox',
                {
                    spacing: this.contentRowSpacing
                },
                /* @__PURE__ */ h('wspacer', {}),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        textColor: Color.red(),
                        font: new Font('SF Mono', 14),
                        opacity: 0.7
                    },
                    '数据加载失败'
                )
            )
        }
    }

    renderMedium = async (w: ListWidget) => {
        return await this.renderCommon(w)
    }

    renderLarge = async (w: ListWidget) => {
        return await this.renderCommon(w)
    }

    async render() {
        const widget = new ListWidget()
        await this.getWidgetBackgroundImage(widget)
        await this.init()
        switch (this.widgetFamily) {
            case 'medium':
                await this.renderMedium(widget)
                break
            case 'large':
                await this.renderLarge(widget)
                break
            default:
                await Utils.renderUnsupport(widget)
                break
        }
        return widget
    }
}

EndAwait(() => Runing(Widget, args.widgetParameter, false))