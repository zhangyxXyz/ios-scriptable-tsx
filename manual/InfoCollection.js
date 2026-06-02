// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: fingerprint;

/*
 * author   :  seiun
 * date     :  2021/10/24
 * desc     :  信息集合
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { WidgetBase, Runing, GenrateView, h, Utils, Storage } = require('./Seiun.Env')
const storage = new Storage('InfoCollectionData')

class Widget extends WidgetBase {
    constructor(arg) {
        super(arg)
        this.name = '信息合集'
        this.en = 'InfoCollection'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter

    padding = { top: 10, left: 10, bottom: 10, right: 10 }
    locationInfo = null
    areaInfo = null
    lunarInfo = null // 阴历信息
    weatherInfo = null
    honeyInfo = null // 情话

    // 组件当前设置
    currentSettings = {
        accountSettings: {
            userName: { val: 'seiun', type: this.settingValTypeString },
            // 和风天气api-key 申请地址： https://dev.heweather.com/
            weatherKey: { val: '', type: this.settingValTypeString },
            // 腾讯位置服务apiKey，自带官方key，也可以使用自己申请的
            tencentApiKey: { val: '', type: this.settingValTypeString },
            lockLocation: { val: '不锁定', type: this.settingValTypeString }
        },
        displaySettings: {
            lunarInfoColorHex: { val: '#C6FFDD', type: this.settingValTypeString },
            honeyInfoColorHex: { val: '#BBD676', type: this.settingValTypeString },
            weatherInfoColorHex: { val: '#FBD786', type: this.settingValTypeString },
            batteryInfoColorHex: { val: '#00FF00', type: this.settingValTypeString },
            yearProgressColorHex: { val: '#F19C65', type: this.settingValTypeString },
            listDataColorShowType: { val: '组件文本颜色', type: this.settingValTypeString }
        }
    }

    init = async () => {
        try {
            await this.getLocation()
            await this.getLocationArea()
            await this.getWeather()
            await this.getLunar(new Date().getDate() - 1)
            await this.getHoney()
        } catch (e) {
            console.log(e)
        }
    }

    // 获取定位信息
    async getLocation() {
        // 如果位置设定保存且锁定了，从缓存文件读取信息
        this.locationInfo = storage.getStorage('location')
        if (this.currentSettings.accountSettings.lockLocation.val.includes('锁定') && this.locationInfo) {
            console.log('[+]位置锁定，使用缓存数据')
        } else {
            try {
                let tmpLocaltion = await Location.current()
                storage.setStorage('location', tmpLocaltion)
                this.locationInfo = tmpLocaltion
                console.log('[+]定位成功')
            } catch (e) {
                console.log(`[+]无法定位，尝试使用缓存定位数据：${e}`)
            }
        }
        console.log(this.locationInfo)
    }

    // 获取定位地址, 使用腾讯定位服务
    async getLocationArea() {
        // 假设存储器已经存在且距离上次请求时间不足60秒，使用存储器数据
        let storageArea = storage.getStorage('area', 1)
        if (storageArea) {
            console.log('[+]腾讯位置API请求时间间隔过小，使用缓存数据')
            this.areaInfo = storageArea
        } else {
            try {
                let location = this.locationInfo || (await this.getLocation())
                // 官方文档的key
                let testKey = 'OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77'
                let apiKey =
                    this.currentSettings.accountSettings.tencentApiKey.val == ''
                        ? testKey
                        : this.currentSettings.accountSettings.tencentApiKey.val
                let areaReqUrl = `https://apis.map.qq.com/ws/geocoder/v1/?location=${location.latitude},${location.longitude}&key=${apiKey}&get_poi=0`
                let area = await this.$request.get({
                    url: areaReqUrl,
                    headers: { Referer: 'https://lbs.qq.com/' }
                })
                console.log('[+]腾讯位置API请求成功：' + areaReqUrl)
                storage.setStorage('area', area)
                this.areaInfo = area
            } catch (err) {
                console.log(`[+]getLocationArea出错，尝试使用缓存数据：${err}`)
                this.areaInfo = storage.getStorage('area')
            }
        }
        console.log(this.areaInfo)
    }

    // 获取天气, 使用和风天气api-key
    async getWeather() {
        // 假设存储器已经存在且距离上次请求时间不足60秒，使用存储器数据
        let storageWeather = storage.getStorage('weather', 1)
        if (storageWeather) {
            console.log('[+]天气请求时间间隔过小，使用缓存数据')
            this.weatherInfo = storageWeather
        } else {
            try {
                let location = this.locationInfo || (await this.getLocation())
                const weatherReqUrl = `https://devapi.heweather.net/v7/weather/now?location=${location.longitude},${location.latitude}&key=${this.currentSettings.accountSettings.weatherKey.val}&lang=zh-cn`
                let weather = await this.$request.get(weatherReqUrl)
                console.log('[+]天气信息请求成功：' + weatherReqUrl)
                storage.setStorage('weather', weather)
                this.weatherInfo = weather
            } catch (e) {
                console.log(`[+]天气信息请求失败，尝试使用缓存数据：${e}`)
                this.weatherInfo = storage.getStorage('weather')
            }
        }
        console.log(this.weatherInfo)
    }

    // 获取万年历数据
    async getLunar(day) {
        try {
            const requestUrl = 'https://wannianrili.51240.com/'
            const defaultHeaders = {
                'user-agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.67 Safari/537.36'
            }
            let html = await this.$request.get({ url: requestUrl, headers: defaultHeaders }, 'STRING')

            let webview = new WebView()
            await webview.loadHTML(html)
            var getData = `
                function getData() {
                    try {
                        infoLunarText = document.querySelector('div#wnrl_k_you_id_${day}.wnrl_k_you .wnrl_k_you_id_wnrl_nongli').innerText
                        holidayText = document.querySelectorAll('div.wnrl_k_zuo div.wnrl_riqi')[${day}].querySelector('.wnrl_td_bzl').innerText
                        lunarYearText = document.querySelector('div.wnrl_k_you_id_wnrl_nongli_ganzhi').innerText
                        lunarYearText = lunarYearText.slice(0, lunarYearText.indexOf('年')+1)
                        if(infoLunarText.search(holidayText) != -1) {
                            holidayText = ''
                        }
                    } catch {
                        holidayText = ''
                    }
                    return {infoLunarText: infoLunarText,  lunarYearText: lunarYearText,  holidayText: holidayText }
                }
                getData()`

            // 节日数据
            let response = await webview.evaluateJavaScript(getData, false)
            console.log(`[+]农历请求成功`)
            storage.setStorage('lunar', response)
            this.lunarInfo = response
        } catch (e) {
            console.log(`[+]农历请求出错，尝试使用缓存信息：${e}`)
            this.lunarInfo = storage.getStorage('lunar')
        }
        console.log(JSON.stringify(this.lunarInfo))
    }

    // 获取情话
    async getHoney() {
        try {
            let honeyData = await this.$request.get('https://api.lovelive.tools/api/SweetNothings?type=json')
            if (honeyData.code === 200 && honeyData.returnObj && honeyData.returnObj[0]) {
                console.log('[+]情话获取成功')
                this.honeyInfo = {
                    data: {
                        content: honeyData.returnObj[0]
                    }
                }
                storage.setStorage('honey', this.honeyInfo)
            } else {
                throw new Error(`return unexpected error code: ${honeyData.code}`)
            }
        } catch (e) {
            console.log(`[+]获取情话失败，尝试使用缓存数据：${e}`)
            this.honeyInfo = storage.getStorage('honey')
        }
        console.log(JSON.stringify(this.honeyInfo))
    }

    getDayHourGreetings(date) {
        const time = date || new Date()
        const hour = time.getHours()
        if (hour < 8) {
            return 'midnight'
        } else if (hour >= 8 && hour < 12) {
            return 'morning'
        } else if (hour >= 12 && hour < 19) {
            return 'afternoon'
        } else if (hour >= 19 && hour < 21) {
            return 'evening'
        } else if (hour >= 21) {
            return 'night'
        }
        return 'mood'
    }

    renderProgress(progress) {
        const used = '▓'.repeat(Math.floor(progress * 24))
        const left = '░'.repeat(24 - used.length)
        return `${used}${left} ${Math.floor(progress * 100)}%`
    }

    renderBattery() {
        const batteryLevel = Device.batteryLevel()
        return this.renderProgress(batteryLevel)
    }

    renderYearProgress() {
        const now = new Date()
        const start = new Date(now.getFullYear(), 0, 1) // Start of this year
        const end = new Date(now.getFullYear() + 1, 0, 1) // End of this year
        const progress = (now - start) / (end - start)
        return this.renderProgress(progress)
    }

    Run() {
        if (config.runsInApp) {
            this.registerSettingCategory('accountSettings', '账号设置', [
                {
                    title: '如何称呼您？',
                    desc: '提示语内对您的称呼',
                    icon: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/flow.png',
                    type: 'text',
                    option: {
                        userName: 'seiun'
                    },
                    config: {
                        placeholder: '如何称呼您？',
                        style: 'compact',
                    },
                },
                {
                    title: '和风天气api-key',
                    desc: '申请地址：https://dev.heweather.com/',
                    icon: { name: 'cloud.sun', color: '#787877' },
                    type: 'password',
                    option: {
                        weatherKey: ''
                    },
                    config: {
                        placeholder: '和风天气api-key',
                        style: 'compact',
                    },
                },
                {
                    title: '腾讯地图api-key',
                    desc: '自带官方key，也可以使用自己申请的',
                    icon: { name: 'mappin.and.ellipse', color: '#46ACFF' },
                    type: 'password',
                    option: {
                        tencentApiKey: ''
                    },
                    config: {
                        placeholder: '腾讯地图api-key',
                        style: 'compact',
                    },
                },
                {
                    title: '是否锁定位置信息',
                    desc: '锁定后将持续使用缓存位置信息，缺省值: 不锁定',
                    icon: { name: 'location.slash', color: '#D371E3' },
                    type: 'select',
                    option: {
                        lockLocation: '不锁定'
                    },
                    config: {
                        selectOptions: [
                            { label: '锁定', value: '锁定' },
                            { label: '不锁定', value: '不锁定' }
                        ],
                        defaultShowContent: '不锁定',
                        multiple: false,
                    },
                }
            ])

            this.registerSettingCategory('displaySettings', '显示设置', [
                {
                    title: '万年历字体颜色',
                    desc: '缺省值: #C6FFDD',
                    icon: { name: 'calendar', color: '#C6FFDD' },
                    type: 'color',
                    option: {
                        lunarInfoColorHex: '#C6FFDD'
                    }
                },
                {
                    title: '情话字体颜色',
                    desc: '缺省值: #BBD676',
                    icon: { name: 'heart.fill', color: '#BBD676' },
                    type: 'color',
                    option: {
                        honeyInfoColorHex: '#BBD676'
                    }
                },
                {
                    title: '天气信息字体颜色',
                    desc: '缺省值: #FBD786',
                    icon: { name: 'cloud.sun.fill', color: '#FBD786' },
                    type: 'color',
                    option: {
                        weatherInfoColorHex: '#FBD786'
                    }
                },
                {
                    title: '电池信息字体颜色',
                    desc: '缺省值: #00FF00',
                    icon: { name: 'battery.100', color: '#00FF00' },
                    type: 'color',
                    option: {
                        batteryInfoColorHex: '#00FF00'
                    }
                },
                {
                    title: '年进度字体颜色',
                    desc: '缺省值: #F19C65',
                    icon: { name: 'chart.bar.fill', color: '#F19C65' },
                    type: 'color',
                    option: {
                        yearProgressColorHex: '#F19C65'
                    }
                },
                {
                    title: '数据条目颜色',
                    desc: '缺省值: 组件文本颜色',
                    icon: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/colorSet.png',
                    type: 'select',
                    option: {
                        listDataColorShowType: '组件文本颜色'
                    },
                    config: {
                        selectOptions: [
                            { label: '组件文本颜色', value: '组件文本颜色' },
                            { label: '随机颜色', value: '随机颜色' }
                        ],
                        defaultShowContent: '组件文本颜色',
                        multiple: false,
                    },
                }
            ])

            this.registerSetting({
                title: '账号设置',
                icon: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/account.png',
                onAction: async (parentWebView) => {
                    await this.presentSettings(['accountSettings'])
                    return true
                },
            })
            this.registerSetting({
                title: '显示设置',
                icon: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/colorSet.png',
                onAction: async (parentWebView) => {
                    await this.presentSettings(['displaySettings'])
                    return true
                },
            })
        }
    }

    renderCommon = async w => {
        const time = new Date()
        const dfTime = new DateFormatter()
        dfTime.locale = 'zh-cn'
        dfTime.useMediumDateStyle()
        dfTime.useNoTimeStyle()

        GenrateView.setListWidget(w)
        return /* @__PURE__ */ h(
            'wbox',
            {
                spacing: 6,
                padding: [12, 12, 12, 0]
            },
            /* @__PURE__ */ h(
                'wtext',
                {
                    textColor:
                        this.currentSettings.displaySettings.listDataColorShowType.val.includes('随机颜色')
                            ? new Color(Utils.randomColor16())
                            : this.widgetColor,
                    font: new Font('Menlo', 11),
                    textAlign: 'left'
                },
                `[🤖]Hi, ${this.currentSettings.accountSettings.userName.val}. Good ${this.getDayHourGreetings(time)}`
            ),
            /* @__PURE__ */ h(
                'wtext',
                {
                    textColor: new Color(this.currentSettings.displaySettings.lunarInfoColorHex.val),
                    font: new Font('Menlo', 11),
                    textAlign: 'left'
                },
                `[🗓]${dfTime.string(time)} ${
                    '农历' + this.lunarInfo.infoLunarText + '·' + this.lunarInfo.lunarYearText + ' ' + this.lunarInfo.holidayText
                }`
            ),
            /* @__PURE__ */ h(
                'wtext',
                {
                    textColor: new Color(this.currentSettings.displaySettings.honeyInfoColorHex.val),
                    font: new Font('Menlo', 11),
                    textAlign: 'left',
                    maxLine: 1
                },
                `[🐷]${this.honeyInfo.data.content}`
            ),
            /* @__PURE__ */ h(
                'wtext',
                {
                    textColor: new Color(this.currentSettings.displaySettings.weatherInfoColorHex.val),
                    font: new Font('Menlo', 11),
                    textAlign: 'left'
                },
                `[🌤]${this.areaInfo.result.address_component.city}·${this.areaInfo.result.address_component.district} ${this.weatherInfo.now.text} T:${this.weatherInfo.now.temp}°  F:${this.weatherInfo.now.feelsLike}° ${this.weatherInfo.now.windDir}`
            ),
            /* @__PURE__ */ h(
                'wtext',
                {
                    textColor: new Color(this.currentSettings.displaySettings.batteryInfoColorHex.val),
                    font: new Font('Menlo', 11),
                    textAlign: 'left'
                },
                `[${Device.isCharging() ? '⚡️' : '🔋'}]${this.renderBattery()} Battery`
            ),
            /* @__PURE__ */ h(
                'wtext',
                {
                    textColor: new Color(this.currentSettings.displaySettings.yearProgressColorHex.val),
                    font: new Font('Menlo', 11),
                    textAlign: 'left'
                },
                `[⏳]${this.renderYearProgress()} YearProgress`
            )
        )
    }

    renderMedium = async (w) => {
        return await this.renderCommon(w)
    }

    renderLarge = async (w) => {
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

await Runing(Widget, args.widgetParameter, false)
