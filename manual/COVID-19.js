// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: bug;
/*
 * author   :  yx.zhang
 * date     :  2021/11/10
 * desc     :  疫情日报
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { WidgetBase, Runing, GenrateView, h, Storage } = require('./zyx.Env')
const Utils = require('./Utils')
const storage = new Storage('COVID-19')

class Widget extends WidgetBase {
    constructor(arg) {
        super(arg)
        this.name = '疫情日报'
        this.en = 'COVID-19'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter

    // 数据信息
    locationInfo = null
    covid19Info = null
    cityCovid19Info = null
    covid19UpdateInfo = null
    covid19newsInfo = null

    // 组件当前设置
    currentSettings = {
        displaySettings: {
            covidDetailCellBgColorHex: { val: '#fff0f1', type: this.settingValTypeString },
            addressBgColorHex: { val: '#f8f8f8', type: this.settingValTypeString },
            addressFontColorHex: { val: '#3BB5F3', type: this.settingValTypeString }
        }
    }

    init = async () => {
        try {
            await this.getLocation()
            await this.getCovid19Info()
            await this.getCovid19UpdateInfo()
            await this.getcovid19newsInfo()
        } catch (e) {
            console.log(e)
        }
    }

    // 获取定位信息
    async getLocation() {
        let storageLocation = storage.getStorage('location', 1)
        if (storageLocation) {
            console.log('[+]位置请求间隔时间过小，使用缓存数据')
            this.locationInfo = storageLocation
        } else {
            try {
                let tmpLocaltion = await Location.current()
                let tmpLocationText = await Location.reverseGeocode(tmpLocaltion.latitude, tmpLocaltion.longitude)
                console.log('[+]定位成功')
                storage.setStorage('location', tmpLocationText[0])
                this.locationInfo = tmpLocationText[0]
            } catch (e) {
                console.log(`[+]无法定位，尝试使用缓存定位数据：${e}`)
                this.locationInfo = storage.getStorage('location')
            }
        }
        console.log(this.locationInfo)
    }

    // 获取疫情数据信息
    async getCovid19Info() {
        let storageCovid19Info = storage.getStorage('covid19Info', 1)
        let storageCityCovid19Info = storage.getStorage('cityCovid19Info', 1)
        if (storageCovid19Info && storageCityCovid19Info) {
            console.log('[+]疫情数据请求间隔时间过小，使用缓存数据')
            this.covid19Info = storageCovid19Info
            this.cityCovid19Info = storageCityCovid19Info
        } else {
            try {
                this.locationInfo = this.locationInfo || (await this.getLocation())
                const { state = '' } = this.locationInfo.postalAddress
                let { city = '' } = this.locationInfo.postalAddress
                let province
                if (!Utils.isEmpty(state)) {
                    province = state.replace('省', '').replace('市', '')
                    this.covid19Info = await this.questInfo({ province }, 'covid19Info')
                } else {
                    province = city.replace('省', '').replace('市', '')
                    this.covid19Info = await this.questInfo({ province }, 'covid19Info')
                }
                if (!Utils.isEmpty(state) && !Utils.isEmpty(city)) {
                    province = state.replace('省', '').replace('市', '')
                    city = city.replace('省', '').replace('市', '')
                    this.cityCovid19Info = await this.questInfo({ province, city }, 'cityCovid19Info')
                }
            } catch (e) {
                console.log('[+]疫情数据请求失败，尝试使用缓存数据')
                this.covid19Info = storage.getStorage('covid19Info')
                this.cityCovid19Info = storage.getStorage('cityCovid19Info')
            }
        }
        console.log(this.covid19Info)
        console.log(this.cityCovid19Info)
    }

    // 获取疫情更新数据信息
    async getCovid19UpdateInfo() {
        let storageCovid19UpdateInfo = storage.getStorage('covid19UpdateInfo', 1)
        if (storageCovid19UpdateInfo) {
            console.log('[+]疫情更新数据请求间隔时间过小，使用缓存数据')
            this.covid19UpdateInfo = storageCovid19UpdateInfo
        } else {
            try {
                const requestUrl = `https://api.inews.qq.com/newsqa/v1/query/inner/publish/modules/list?modules=provinceCompare&today=${Utils.time(
                    'MM.dd',
                    new Date()
                )}`
                console.log(requestUrl)
                const response = await this.$request.post(requestUrl)
                if (response.ret === 0 && response.data) {
                    const data = response.data.provinceCompare
                    this.locationInfo = this.locationInfo || (await this.getLocation())
                    let { state = '', city = '' } = this.locationInfo.postalAddress
                    state = state.replace('省', '').replace('市', '')
                    city = city.replace('省', '').replace('市', '')
                    if (data[state]) this.covid19UpdateInfo = data[state] || void 0
                    if (data[city]) this.covid19UpdateInfo = data[city] || void 0
                    console.log('[+]疫情更新数据请求成功')
                    storage.setStorage('covid19UpdateInfo', this.covid19UpdateInfo)
                }
            } catch (e) {
                console.log('[+]疫情更新数据请求失败，尝试使用缓存数据')
                this.covid19UpdateInfo = storage.getStorage('covid19UpdateInfo')
            }
            console.log(this.covid19UpdateInfo)
        }
    }

    // 获取疫情新闻信息
    async getcovid19newsInfo() {
        if (this.widgetFamily != 'large') {
            this.covid19newsInfo = null
            return
        }
        let storageCovid19newsInfo = storage.getStorage('covid19newsInfo', 1)
        if (storageCovid19newsInfo) {
            console.log('[+]疫情新闻数据请求间隔时间过小，使用缓存数据')
            this.covid19newsInfo = storageCovid19newsInfo
        } else {
            try {
                this.locationInfo = this.locationInfo || (await this.getLocation())
                let { city = '' } = this.locationInfo.postalAddress
                city = city.replace('省', '').replace('市', '')
                const requestUrl = `https://api.dreamreader.qq.com/news/v1/province/news/list?province_code=${Utils.char2PinFirstChar(
                    city
                )}&page_size=4&today=${Utils.time('MM.dd', new Date())}`
                console.log(requestUrl)
                const response = (await this.$request.get(requestUrl))?.data?.items
                console.log('[+]疫情新闻数据请求成功')
                storage.setStorage('covid19newsInfo', response || '')
                this.covid19newsInfo = response
            } catch (e) {
                console.log('[+]疫情新闻数据请求失败，尝试使用缓存数据')
                this.covid19newsInfo = storage.getStorage('covid19newsInfo')
            }
        }
        console.log(this.covid19newsInfo)
    }

    async questInfo(locInfo, storageKey) {
        const query = Object.keys(locInfo).map(item => {
            return `${item}=${encodeURIComponent(locInfo[item])}`
        })
        query.push('today=' + Utils.time('MM.dd', new Date()))
        const requestUrl = `https://api.inews.qq.com/newsqa/v1/query/pubished/daily/list?${query.join('&')}`
        console.log(requestUrl)
        const response = await this.$request.post(requestUrl)

        if (response && response.ret === 0 && response.data) {
            console.log('[+]疫情数据请求成功')
            storage.setStorage(storageKey, response.data[response.data.length - 1])
            return response.data[response.data.length - 1]
        }
    }

    formatNumber(number) {
        if (!number) return `+0`
        return number >= 0 ? `+${number}` : `${number}`
    }

    Run() {
        if (config.runsInApp) {
            this.registerExtraSettingsCategory('displaySettings', '显示设置')
            this.registerExtraSettingsCategoryItem(
                'displaySettings',
                'text',
                '疫情数据面板背景颜色',
                '\n缺省值：#fff0f1',
                { covidDetailCellBgColorHex: '#fff0f1' },
                { name: 'number.square', color: '#5BD078' }
            )
            this.registerExtraSettingsCategoryItem(
                'displaySettings',
                'text',
                '定位信息背景颜色',
                '\n缺省值：#f8f8f8',
                { addressBgColorHex: '#f8f8f8' },
                { name: 'number.square', color: '#5BD078' }
            )
            this.registerExtraSettingsCategoryItem(
                'displaySettings',
                'text',
                '定位信息字体颜色',
                '\n缺省值：#3bb5f3',
                { addressFontColorHex: '#3bb5f3' },
                { name: 'number.square', color: '#5BD078' }
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

    renderCovidNews() {
        return (
            /* @__PURE__ */ h('wspacer', {
                length: 5
            }),
            /* @__PURE__ */ h(
                'wstack',
                {
                    borderRadius: 10,
                    padding: [5, 5, 5, 5],
                    flexDirection: 'column'
                },
                this.covid19newsInfo.map((item, index) => {
                    return /* @__PURE__ */ h(
                        'wstack',
                        {
                            href: item.news_url
                        },
                        /* @__PURE__ */ h(
                            'wstack',
                            {
                                flexDirection: 'column'
                            },
                            /* @__PURE__ */ h(
                                'wtext',
                                {
                                    font: 12,
                                    maxLine: 1,
                                    textColor: this.widgetColor
                                },
                                item.title
                            ),
                            /* @__PURE__ */ h('wspacer', {
                                length: 5
                            }),
                            /* @__PURE__ */ h(
                                'wtext',
                                {
                                    font: 12,
                                    textColor: this.widgetColor,
                                    opacity: 0.5
                                },
                                item.srcfrom
                            )
                        ),
                        /* @__PURE__ */ h('wspacer', null),
                        /* @__PURE__ */ h('wimage', {
                            src: item.shortcut,
                            width: 40,
                            height: 30,
                            borderRadius: 4
                        }),
                        this.covid19newsInfo?.length - 1 !== index &&
                            /* @__PURE__ */ h('wspacer', {
                                length: 5
                            })
                    )
                })
            )
        )
    }

    renderCityCovidInfo() {
        return (
            /* @__PURE__ */ h('wspacer', {
                length: 5
            }),
            /* @__PURE__ */ h(
                'wstack',
                {
                    verticalAlign: 'center'
                },
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        font: 12,
                        textColor: this.widgetColor
                    },
                    this.cityCovid19Info?.confirm_add || '0',
                    '新增'
                ),
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        font: 12,
                        textColor: this.widgetColor
                    },
                    this.cityCovid19Info?.confirm || '0',
                    '确诊'
                ),
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        font: 12,
                        textColor: this.widgetColor
                    },
                    this.cityCovid19Info?.heal || '0',
                    '治愈'
                ),
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        font: 12,
                        textColor: this.widgetColor
                    },
                    this.cityCovid19Info?.dead || '0',
                    '死亡'
                ),
                /* @__PURE__ */ h('wspacer', null)
            )
        )
    }

    renderCovidDetailCell(data) {
        return /* @__PURE__ */ h(
            'wstack',
            {
                flexDirection: 'column',
                background: data.bg
            },
            /* @__PURE__ */ h('wspacer', null),
            /* @__PURE__ */ h(
                'wstack',
                null,
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        font: 12,
                        textColor: this.widgetColor
                    },
                    '较上日'
                ),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        font: 12,
                        textColor: data.color
                    },
                    data.addnum
                ),
                /* @__PURE__ */ h('wspacer', null)
            ),
            /* @__PURE__ */ h('wspacer', {
                length: 2
            }),
            /* @__PURE__ */ h(
                'wstack',
                null,
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        textColor: data.color
                    },
                    data.value
                ),
                /* @__PURE__ */ h('wspacer', null)
            ),
            /* @__PURE__ */ h('wspacer', {
                length: 2
            }),
            /* @__PURE__ */ h(
                'wstack',
                null,
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        font: 12,
                        textColor: this.widgetColor
                    },
                    data.text
                ),
                /* @__PURE__ */ h('wspacer', null)
            ),
            /* @__PURE__ */ h('wspacer', null)
        )
    }

    renderCommon = async w => {
        GenrateView.setListWidget(w)
        return /* @__PURE__ */ h(
            'wbox',
            {
                background: this.backGroundColor
            },
            /* @__PURE__ */ h('wspacer', null),
            /* @__PURE__ */ h(
                'wstack',
                {
                    borderRadius: 10
                },
                this.renderCovidDetailCell({
                    color: '#f23a3b',
                    bg: this.currentSettings.displaySettings.covidDetailCellBgColorHex.val,
                    value: `${(this.covid19Info?.confirm || 0) - parseInt(this.covid19Info?.heal || '0') || '-'}`,
                    text: '现有确诊',
                    addnum: this.formatNumber(this.covid19UpdateInfo?.nowConfirm)
                }),
                /* @__PURE__ */ h('wspacer', {
                    length: 2
                }),
                this.renderCovidDetailCell({
                    color: '#cc1e1e',
                    bg: this.currentSettings.displaySettings.covidDetailCellBgColorHex.val,
                    value: `${this.covid19Info?.confirm || '-'}`,
                    text: '累计确诊',
                    addnum: this.formatNumber(this.covid19UpdateInfo?.confirmAdd)
                }),
                /* @__PURE__ */ h('wspacer', {
                    length: 2
                }),
                this.renderCovidDetailCell({
                    color: '#178b50',
                    bg: this.currentSettings.displaySettings.covidDetailCellBgColorHex.val,
                    value: `${this.covid19Info?.heal || '-'}`,
                    text: '累计治愈',
                    addnum: this.formatNumber(this.covid19UpdateInfo?.heal)
                }),
                /* @__PURE__ */ h('wspacer', {
                    length: 2
                }),
                this.renderCovidDetailCell({
                    color: '#4e5a65',
                    bg: this.currentSettings.displaySettings.covidDetailCellBgColorHex.val,
                    value: `${this.covid19Info?.dead || '-'}`,
                    text: '累计死亡',
                    addnum: this.formatNumber(this.covid19UpdateInfo?.dead)
                })
            ),
            /* @__PURE__ */ h('wspacer', {
                length: 5
            }),
            /* @__PURE__ */ h(
                'wstack',
                {
                    borderRadius: 10,
                    padding: [5, 5, 5, 5],
                    flexDirection: 'column',
                    background: this.currentSettings.displaySettings.addressBgColorHex.val
                },
                /* @__PURE__ */ h(
                    'wstack',
                    {
                        verticalAlign: 'center'
                    },
                    /* @__PURE__ */ h('wimage', {
                        src: 'location',
                        filter: this.currentSettings.displaySettings.addressFontColorHex.val,
                        opacity: 0.8,
                        width: 12,
                        height: 12
                    }),
                    /* @__PURE__ */ h('wspacer', {
                        length: 5
                    }),
                    /* @__PURE__ */ h(
                        'wtext',
                        {
                            textColor: this.currentSettings.displaySettings.addressFontColorHex.val,
                            font: 12,
                            opacity: 0.8
                        },
                        (this.locationInfo?.postalAddress.city || '') + (this.locationInfo?.postalAddress.street || '') || '未找到定位'
                    ),
                    /* @__PURE__ */ h('wspacer', null)
                ),
                this.cityCovid19Info && this.renderCityCovidInfo()
            ),
            this.covid19newsInfo && this.renderCovidNews(),
            /* @__PURE__ */ h('wspacer', null),
            /* @__PURE__ */ h(
                'wstack',
                {
                    verticalAlign: 'center',
                    padding: [0, 10, 10, 10]
                },
                /* @__PURE__ */ h('wimage', {
                    src: 'https://img.icons8.com/cute-clipart/2x/coronavirus.png',
                    width: 15,
                    height: 15
                }),
                /* @__PURE__ */ h('wspacer', {
                    length: 10
                }),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        opacity: 0.5,
                        font: 14,
                        textColor: this.widgetColor
                    },
                    '疫情日报'
                ),
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h('wimage', {
                    src: 'arrow.clockwise',
                    width: 10,
                    height: 10,
                    opacity: 0.5,
                    filter: this.widgetColor
                }),
                /* @__PURE__ */ h('wspacer', {
                    length: 10
                }),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        font: 12,
                        textAlign: 'right',
                        opacity: 0.5,
                        textColor: this.widgetColor
                    },
                    Utils.time('HH:mm:ss')
                )
            )
        )
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
