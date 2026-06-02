// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: feather-alt;

/*
 * author   :  seiun
 * date     :  2021/10/21
 * desc     :  一言
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { WidgetBase, Runing, GenrateView, h, Utils} = require('./Seiun.Env')

class Widget extends WidgetBase {
    constructor(arg) {
        super(arg)
        this.name = '一言'
        this.en = 'One Word'
        this.storageExpirationMinutes = 1
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
            apiUrl: {var: 'https://v1.hitokoto.cn', type: this.settingValTypeString},
            filterTypes: {val: [], type: this.settingValTypeArray},
        },
        displaySettings: {
            listDataColorShowType: {val: '随机颜色', type: this.settingValTypeString},
        },
    }

    init = async () => {
        try {
            await this.getData()
        } catch (e) {
            console.log(e)
        }
    }

    async getData() {
        let storageWord = this.storage.getStorage('word', 1)
        if (storageWord) {
            console.log('[+]请求间隔时间过小，使用缓存数据')
            this.httpData = storageWord
        } else {
            this.isRequestSuccess = false
            try {
                let filterTypes = this.currentSettings.basicSettings.filterTypes.val || []
                if (this.splitWidgetParam.length >= 2) {
                    filterTypes = this.splitWidgetParam[1].split('')
                }
                let apiUrl = (this.currentSettings.basicSettings.apiUrl.val || 'https://v1.hitokoto.cn').replace(/\/$/, '')
                let types = filterTypes.map(c => `c=${c}`).join('&') || ''
                types = Utils.isEmpty(types) ? '' : `?${types}`
                let url = `${apiUrl}${types}`
                let data = await this.$request.get(url)
                console.log('[+]数据请求成功：' + url)
                this.storage.setStorage('word', data)
                this.httpData = data
                this.isRequestSuccess = true
            } catch (err) {
                console.log(`[+]getData出错，尝试使用缓存数据：${err}`)
                this.httpData = this.storage.getStorage('word')
            }
        }
        console.log(this.httpData)
    }



    Run() {
        if (config.runsInApp) {
            this.registerSettingCategory('basicSettings', '基础设置', [
                {
                    title: 'API',
                    desc: '设置一言api地址',
                    icon: {name: 'link', color: '#1890ff'},
                    type: 'text',
                    option: {
                        apiUrl: 'https://v1.hitokoto.cn',
                    },
                    config: {
                        placeholder: 'https://v1.hitokoto.cn',
                        style: 'compact',
                        truncateLength: -1,
                    },
                },
                {
                    title: '分类',
                    desc: '选择一言分类(可多选)\n缺省值: 全分类',
                    icon: {name: 'list.bullet.rectangle', color: '#722ed1'},
                    type: 'select',
                    option: {
                        filterTypes: [],
                    },
                    config: {
                        selectOptions: [
                            {label: '动画', value: 'a'},
                            {label: '漫画', value: 'b'},
                            {label: '游戏', value: 'c'},
                            {label: '文学', value: 'd'},
                            {label: '原创', value: 'e'},
                            {label: '来自网络', value: 'f'},
                            {label: '其他', value: 'g'},
                            {label: '影视', value: 'h'},
                            {label: '诗词', value: 'i'},
                            {label: '网易云', value: 'j'},
                            {label: '哲学', value: 'k'},
                            {label: '抖机灵', value: 'l'},
                        ],
                        defaultShowContent: '全分类',
                        multiple: true,
                        editable: true,
                    },
                },
            ])
            
            this.registerSettingCategory('displaySettings', '显示设置', [
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
            if (this.widgetParam) {
                this.splitWidgetParam = this.widgetParam.split(',')
            }
        } catch (e) {
            console.log(e)
        }
    }

    renderCommon = async w => {
        if (this.httpData) {
            var {hitokoto = '', from = ''} = this.httpData
            const isEmpty = function (obj) {
                if (typeof obj == 'undefined' || obj == null || obj == '') {
                    return true
                }
                return false
            }
            if (!isEmpty(this.httpData.from_who) || !isEmpty(this.httpData.from)) {
                from = ''
                if (this.widgetFamily == 'medium' && !isEmpty(this.httpData.from_who)) {
                    from += this.httpData.from_who
                }
                if (!isEmpty(this.httpData.from)) {
                    from += '「' + this.httpData.from + '」'
                }
            } else {
                from = '佚名'
            }
            GenrateView.setListWidget(w)
            const oneWordIconB64 = await this.storage.getImage('https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Application/OneWord.png')
            return /* @__PURE__ */ h(
                'wbox',
                {
                    background: this.backGroundColor,
                },
                /* @__PURE__ */ h(
                    'wstack',
                    {
                        verticalAlign: 'center',
                    },
                    /* @__PURE__ */ h('wimage', {
                        /* src: 'url', */
                        src: oneWordIconB64,
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                    }),
                    /* @__PURE__ */ h('wspacer', {
                        length: 10,
                    }),
                    /* @__PURE__ */ h(
                        'wtext',
                        {
                            opacity: 0.7,
                            font: Font.boldSystemFont(12),
                            textColor: this.widgetColor,
                        },
                        '一言',
                    ),
                ),
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        font: Font.lightSystemFont(16),
                        textColor: (
                            this.splitWidgetParam.length >= 1
                                ? parseInt(this.splitWidgetParam[0]) === 1
                                : (this.currentSettings.displaySettings.listDataColorShowType.val || '') === '随机颜色'
                        )
                            ? Utils.randomColor16()
                            : this.widgetColor,
                        /* onClick: () => this.render(),*/
                    },
                    hitokoto,
                ),
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        font: Font.lightSystemFont(12),
                        textColor: this.widgetColor,
                        opacity: 0.5,
                        textAlign: 'right',
                        maxLine: 1,
                    },
                    from,
                ),
            )
        } else {
            if (!this.isRequestSuccess) {
                GenrateView.setListWidget(w)
            }
        }
        return w
    }

    renderSmall = async (w) => {
        return await this.renderCommon(w)
    }

    renderMedium = async (w) => {
        return await this.renderCommon(w)
    }

    renderLarge = async (w) => {
        return await this.renderCommon(w)
    }

    renderAccessoryInline = async (w) => {
        if (this.httpData && this.httpData.hitokoto) {
            const hitokoto = this.httpData.hitokoto
            w.addText(hitokoto)
        } else {
            w.addText('人这辈子不就是笑笑别人和被别人笑笑嘛~')
        }
        return w
    }

    async render() {
        const widget = new ListWidget()
        await this.getWidgetBackgroundImage(widget)
        await this.init()
        switch (this.widgetFamily) {
            case 'small':
                await this.renderSmall(widget)
                break
            case 'medium':
                await this.renderMedium(widget)
                break
            case 'large':
                await this.renderLarge(widget)
                break
            case 'accessoryInline':
                await this.renderAccessoryInline(widget)
                break
            default:
                await Utils.renderUnsupport(widget)
                break
        }
        return widget
    }
}

await Runing(Widget, args.widgetParameter, false)
