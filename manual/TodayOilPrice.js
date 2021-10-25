// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: car;

/*
 * author   :  yx.zhang
 * date     :  2021/10/24
 * desc     :  今日油价, 采用了2Ya的DmYY依赖 https://github.com/dompling/Scriptable/tree/master/Scripts
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { DmYY, Runing } = require('./DmYY')
const { GenrateView, h, RowCenter } = require('./GenrateView')
const Utils = require('./Utils')

const { Storage } = require('./DataStorage')
const storage = new Storage(module.filename)
class Widget extends DmYY {
    constructor(arg) {
        super(arg)
        this.name = '今日油价'
        this.en = 'TodayOilPrice'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter

    widgetInitConfig = {
        tencentMapAPIKey: '@caiyun.token.tencent'
    }

    tencentMapAPIKey = ''

    headerBGColorHex = '#000000'
    oilNameColorHex = '#FC6D26'
    oilPriceColorHex = null
    gasStationBGColorHex = '#000000'
    gasStationCarIconColorHex = '#61AFEF'
    gasStationAddressIconColorHex = '#E06C75'
    footBGColorHex = '#000000'
    footLogoColorHex = '#FC6D26'
    distance2NearestGasStation = 5000

    locationInfo = null
    oilPriceInfo = null
    gasStationInfo = []

    init = async () => {
        try {
            await this.getLocation()
            await this.getOilPrice()
            await this.getGasStation()
        } catch (e) {
            console.log(e)
        }
    }

    // 获取定位信息
    async getLocation() {
        try {
            const location = await Location.current()
            const locationText = await Location.reverseGeocode(location.latitude, location.longitude)
            // 直辖市 administrativeArea 值会为null，注意处理
            // const { locality = '', administrativeArea = '四川' } = locationText[0] || {}
            console.log(`[+]定位成功`)
            storage.setStorage('location', locationText[0] || {})
            this.locationInfo = locationText[0] || {}
        } catch (e) {
            console.log(`[+]无法定位，尝试使用缓存定位数据：${e}`)
            this.locationInfo = storage.getStorage('location')
        }
        console.log(this.locationInfo)
    }

    // 获取油价信息
    async getOilPrice() {
        // 假设存储器已经存在且距离上次请求时间不足60秒，使用存储器数据
        let storageOilPrice = storage.getStorage('oilPrice', 1)
        if (storageOilPrice) {
            console.log('[+]油价查询请求时间间隔过小，使用缓存数据')
            this.oilPriceInfo = storageOilPrice
        } else {
            const location = this.locationInfo || (await this.getLocation())
            // 直辖市省份为空
            let _area = [
                location.administrativeArea ? Utils.char2PinFullChar(location.administrativeArea.replace('省', '')) : '',
                Utils.char2PinFullChar(location.locality || '')
            ]
            if (!_area[0]) {
                _area = _area[1].replace('shi', '/')
            } else {
                _area = _area.join('/') + '.html'
            }
            const url = `http://youjia.chemcp.com/${_area}`
            const webView = new WebView()
            await webView.loadURL(url)
            const javascript = `
                const data = []
                const oil = document.querySelectorAll('table')[4].querySelectorAll('tr')
                for (let i = 0; i < oil.length; i++) {
                    const dateItem = {}
                    let value = oil[i].innerText
                    value = value.split('	')
                    dateItem.cate = value[0]
                    dateItem.value = value[1]
                    data.push(dateItem)
                }
                completion(data)
            `

            await webView
                .evaluateJavaScript(javascript, true)
                .then(async e => {
                    let data = typeof e === 'string' ? JSON.parse(e) : e
                    console.log(`[+]油价查询成功`)
                    storage.setStorage('oilPrice', data)
                    this.oilPriceInfo = data
                    return
                })
                .catch(() => {
                    console.log(`[+]油价查询失败，尝试使用缓存数据`)
                    this.oilPriceInfo = storage.getStorage('oilPrice') || {}
                    return
                })
        }
        console.log(this.oilPriceInfo)
    }

    // 获取就近加油站信息
    async getGasStation() {
        const location = this.locationInfo || (await this.getLocation())
        const { longitude = 116.46869029185218, altitude = 0, latitude = 40.00690378888461 } = location?.location || {}
        const params = {
            boundary: `nearby(${latitude},${longitude},${this.distance2NearestGasStation})`,
            page_size: 20,
            page_index: 1,
            keyword: '加油站',
            orderby: '_distance',
            key: this.tencentMapAPIKey
        }
        const data = Object.keys(params).map(key => `${key}=${params[key]}`)
        const url = 'https://apis.map.qq.com/ws/place/v1/search?' + encodeURIComponent(data.join('&'))
        console.log(url)
        try {
            const httpData = await this.$request.get(url)
            const gasStationData = httpData && httpData.status == 0 ? httpData.data : []
            const infos = gasStationData?.splice(0, this.widgetFamily === 'large' ? 4 : 1)
            console.log(`[+]就近加油站信息请求成功`)
            storage.setStorage('gasStation', infos)
            this.gasStationInfo = infos
        } catch (error) {
            console.log(`[+]就近加油站信息请求失败，尝试使用缓存：${error}`)
            this.gasStationInfo = storage.getStorage('gasStation')
        }
        console.log(this.gasStationInfo)
    }

    Run() {
        if (config.runsInApp) {
            this.registerAction('腾讯地图 Token', async () => {
                await this.setAlertInput(`${this.name}腾讯Token`, 'BoxJS 缓存 | 手动输入', {
                    tencentMapAPIKey: '腾讯地图 Token'
                })
            })
            this.registerAction(
                '代理缓存',
                async () => {
                    await this.setCacheBoxJSData(this.widgetInitConfig)
                },
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/boxjs.png'
            )
            this.registerAction(
                '数据显示配置',
                async () => {
                    await this.setAlertInput(`${this.name}数据显示配置`, '配置Widget模块颜色', {
                        headerBGColorHex: '顶部油价背景颜色',
                        oilNameColorHex: '油名称字体颜色',
                        oilPriceColorHex: '油价格字体颜色',
                        gasStationBGColorHex: '加油站详情背景颜色',
                        footBGColorHex: '底部页脚背景颜色',
                        footLogoColorHex: '底部页脚logo颜色'
                    })
                },
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/colorSet.png'
            )
            this.registerAction(
                '就近加油站配置',
                async () => {
                    await this.setAlertInput(`${this.name}就近加油站配置`, '查询距离范围：单位m', {
                        distance2NearestGasStation: '就近加油站查询范围，单位m'
                    })
                },
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/more.png'
            )
            this.registerAction(
                '基础设置',
                this.setWidgetConfig,
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/preferences.png'
            )
        }

        try {
            const {
                tencentMapAPIKey,
                headerBGColorHex,
                oilNameColorHex,
                oilPriceColorHex,
                gasStationBGColorHex,
                footBGColorHex,
                footLogoColorHex,
                distance2NearestGasStation
            } = this.settings
            this.tencentMapAPIKey = tencentMapAPIKey ? tencentMapAPIKey : this.tencentMapAPIKey
            this.headerBGColorHex = headerBGColorHex ? headerBGColorHex : this.headerBGColorHex
            this.oilNameColorHex = oilNameColorHex ? oilNameColorHex : this.oilNameColorHex
            this.oilPriceColorHex = oilPriceColorHex ? oilPriceColorHex : this.oilPriceColorHex
            this.gasStationBGColorHex = gasStationBGColorHex ? gasStationBGColorHex : this.gasStationBGColorHex
            this.footBGColorHex = footBGColorHex ? footBGColorHex : this.footBGColorHex
            this.footLogoColorHex = footLogoColorHex ? footLogoColorHex : this.footLogoColorHex
            this.distance2NearestGasStation = distance2NearestGasStation
                ? parseInt(distance2NearestGasStation)
                : this.distance2NearestGasStation
        } catch (error) {
            console.log(error)
        }
    }

    renderOilPrice(data) {
        return /* @__PURE__ */ h(
            'wstack',
            {
                flexDirection: 'column',
                verticalAlign: 'center'
            },
            /* @__PURE__ */ h(
                'wstack',
                null,
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        textAlign: 'center',
                        textColor: this.oilNameColorHex,
                        font: new Font('Chalkduster', 26)
                    },
                    data.cate.replace('号汽油', '').replace('号柴油', '')
                ),
                /* @__PURE__ */ h(
                    'wstack',
                    {
                        flexDirection: 'column',
                        verticalAlign: 'bottom'
                    },
                    /* @__PURE__ */ h('wspacer', null),
                    /* @__PURE__ */ h('wspacer', null),
                    // /* @__PURE__ */ h(
                    //     'wtext',
                    //     {
                    //         textColor: this.oilNameColorHex,
                    //         font: 8,
                    //         textAlign: 'center'
                    //     },
                    //     '号'
                    // ),
                    /* @__PURE__ */ h(
                        'wtext',
                        {
                            textColor: this.oilNameColorHex,
                            font: 12,
                            textAlign: 'center'
                        },
                        data.cate.indexOf('汽油') != -1 ? '汽油' : '柴油'
                    )
                ),
                /* @__PURE__ */ h('wspacer', null)
            ),
            /* @__PURE__ */ h('wspacer', {
                length: 10
            }),
            /* @__PURE__ */ h(
                'wstack',
                null,
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        textColor: this.oilPriceColorHex || this.widgetColor,
                        font: new Font('Chalkduster', 16),
                        textAlign: 'center'
                    },
                    data.value.replace('/升', '').replace('元', '')
                ),
                /* @__PURE__ */ h(
                    'wstack',
                    {
                        flexDirection: 'column',
                        verticalAlign: 'center'
                    },
                    /* @__PURE__ */ h('wspacer', null),
                    /* @__PURE__ */ h(
                        'wtext',
                        {
                            textColor: this.oilPriceColorHex || this.widgetColor,
                            font: new Font('Chalkduster', 10),
                            textAlign: 'center'
                        },
                        '/L'
                    )
                ),
                /* @__PURE__ */ h('wspacer', null)
            )
        )
    }

    renderStackCellText(data) {
        return /* @__PURE__ */ h(
            'wstack',
            {
                verticalAlign: 'center'
            },
            /* @__PURE__ */ h('wspacer', {
                length: 5
            }),
            /* @__PURE__ */ h('wimage', {
                src: data.icon,
                width: 10,
                height: 10,
                filter: data.iconColor || this.widgetColor
            }),
            /* @__PURE__ */ h('wspacer', {
                length: 5
            }),
            /* @__PURE__ */ h(
                'wtext',
                {
                    href: data.href,
                    font: 10,
                    textColor: this.widgetColor,
                    maxLine: 1
                },
                data.label,
                '：',
                data.value || '-'
            ),
            /* @__PURE__ */ h('wspacer', null)
        )
    }

    renderGasStation(gasStation) {
        return gasStation.map((item, index) => {
            const href = `iosamap://navi?sourceApplication=applicationName&backScheme=applicationScheme&poiname=fangheng&poiid=BGVIS&lat=${item.location.lat}&lon=${item.location.lng}&dev=1&style=2`
            return /* @__PURE__ */ h(
                'wstack',
                {
                    flexDirection: 'column',
                    borderRadius: 4,
                    href
                },
                this.renderStackCellText({
                    value: `${item.title}(${item._distance}米)`,
                    label: '油站',
                    href,
                    icon: 'car',
                    iconColor: this.gasStationCarIconColorHex
                }),
                /* @__PURE__ */ h('wspacer', {
                    length: 2
                }),
                this.renderStackCellText({
                    value: item.address,
                    label: '地址',
                    href,
                    icon: 'mappin.and.ellipse',
                    iconColor: this.gasStationAddressIconColorHex
                }),
                /* @__PURE__ */ h('wspacer', {
                    length: 2
                }),
                this.renderStackCellText({ value: item.tel, label: '电话', href: 'tel:' + item.tel, icon: 'iphone' }),
                gasStation.length - 1 !== index && /* @__PURE__ */ h('wspacer', null)
            )
        })
    }

    renderCommon = async w => {
        GenrateView.setListWidget(w)
        return /* @__PURE__ */ h(
            'wbox',
            {
                background: this.backGroundColor,
                padding: [0, 0, 0, 0]
            },
            /* @__PURE__ */ h(
                'wstack',
                {
                    background: this.headerBGColorHex,
                    padding: [10, 10, 10, 10]
                },
                this.oilPriceInfo.map(item => {
                    const city = this.locationInfo?.locality?.replace('市', '') || ''
                    const cate = item.cate.replace(city, '').replace('#', '号').replace('价格', '')
                    return this.renderOilPrice({ ...item, cate })
                })
            ),
            this.gasStationInfo.length > 0 &&
                /* @__PURE__ */ h(
                    'wstack',
                    {
                        background: this.gasStationBGColorHex,
                        flexDirection: 'column',
                        padding: [10, 10, 10, 10]
                    },
                    this.renderGasStation(this.gasStationInfo)
                ),
            /* @__PURE__ */ h('wspacer', null),
            /* @__PURE__ */ h(
                'wstack',
                {
                    background: this.footBGColorHex,
                    verticalAlign: 'center',
                    padding: [0, 10, 10, 10]
                },
                /* @__PURE__ */ h('wimage', {
                    src: 'data:image/png;base64,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',
                    width: 15,
                    height: 15,
                    filter: this.footLogoColorHex
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
                    '今日油价 • ' +
                        (this.locationInfo?.administrativeArea?.replace('省', '') || '') +
                        (this.locationInfo?.locality?.replace('市', '') || '')
                ),
                /* @__PURE__ */ h('wspacer', null),
                /* @__PURE__ */ h('wimage', {
                    src: 'arrow.clockwise',
                    width: 10,
                    height: 10,
                    filter: this.widgetColor,
                    opacity: 0.5
                }),
                /* @__PURE__ */ h('wspacer', {
                    length: 10
                }),
                /* @__PURE__ */ h(
                    'wtext',
                    {
                        font: 12,
                        textAlign: 'right',
                        textColor: this.widgetColor,
                        opacity: 0.5
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
