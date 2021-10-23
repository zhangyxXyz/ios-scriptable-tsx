// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: fingerprint;

/*
 * author   :  yx.zhang
 * date     :  2021/10/24
 * desc     :  信息集合, 采用了2Ya的DmYY依赖 https://github.com/dompling/Scriptable/tree/master/Scripts
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { DmYY, Runing } = require('./DmYY')
const { GenrateView, h } = require('./GenrateView')
const Utils = require('./Utils')
const { Storage } = require('./DataStorage')

const storage = new Storage('InfoCollectionData')

class Widget extends DmYY {
    constructor(arg) {
        super(arg)
        this.name = '信息合集'
        this.en = 'InfoCollection'
        this.Run()
    }

    // 组件传入参数
    widgetParam = args.widgetParameter

    isRandomColor = true // 提示语是否使用随机颜色
    padding = { top: 10, left: 10, bottom: 10, right: 10 }
    userName = 'yx.zhang'
    weatherKey = '' // 和风天气api-key 申请地址： https://dev.heweather.com/

    tencentApiKey = '' // 腾讯位置服务apiKey，自带官方key，也可以使用自己申请的
    lockLocation = false //是否锁定定位信息

    // 颜色配置
    lunarInfoColorHex = '#C6FFDD'
    honeyInfoColorHex = '#BBD676'
    weatherInfoColorHex = '#FBD786'
    batteryInfoColorHex = '#00FF00'
    yearProgressColorHex = '#F19C65'

    locationInfo = null
    areaInfo = null
    lunarInfo = null // 阴历信息
    weatherInfo = null
    honeyInfo = null // 情话

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
        if (this.lockLocation && this.locationInfo) {
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
                let apiKey = this.tencentApiKey == '' ? testKey : this.tencentApiKey
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
                const weatherReqUrl = `https://devapi.heweather.net/v7/weather/now?location=${location.longitude},${location.latitude}&key=${this.weatherKey}&lang=zh-cn`
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
            let honeyData = await this.$request.get('https://api.vvhan.com/api/love?type=json')
            console.log('[+]情话获取成功')
            storage.setStorage('honey', honeyData)
            this.honeyInfo = honeyData
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
            this.registerAction(
                '账号设置',
                async () => {
                    await this.setAlertInput(`${this.name}账号配置`, '如何称呼您？\n和风天气api key\n腾讯地图api key', {
                        userName: '主人',
                        weatherKey: '申请地址：https://dev.heweather.com/',
                        tencentApiKey: '选填，内附官方Key'
                    })
                },
                'https://raw.githubusercontent.com/zhangyxXyz/IconSet/master/Scriptable/Settings/account.png'
            )
            this.registerAction(
                '数据显示配置',
                async () => {
                    await this.setAlertInput(`${this.name}数据显示配置`, '问候语颜色是否随机\n条目颜色自定义配置', {
                        isRandomColor: '0 不随机, 1 随机',
                        lunarInfoColorHex: '万年历字体颜色Hex代码',
                        honeyInfoColorHex: '情话字体颜色Hex代码',
                        weatherInfoColorHex: '天气信息字体颜色Hex代码',
                        batteryInfoColorHex: '电池信息字体颜色Hex代码',
                        yearProgressColorHex: '年进度字体颜色Hex代码,'
                    })
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
            const {
                userName,
                weatherKey,
                tencentApiKey,
                isRandomColor,
                lunarInfoColorHex,
                honeyInfoColorHex,
                weatherInfoColorHex,
                batteryInfoColorHex,
                yearProgressColorHex
            } = this.settings
            this.userName = userName ? userName : this.userName
            this.weatherKey = weatherKey ? weatherKey : this.weatherKey
            this.tencentApiKey = tencentApiKey ? tencentApiKey : this.tencentApiKey
            this.isRandomColor = isRandomColor ? parseInt(isRandomColor) == 1 : this.isRandomColor
            this.lunarInfoColorHex = lunarInfoColorHex ? lunarInfoColorHex : this.lunarInfoColorHex
            this.honeyInfoColorHex = honeyInfoColorHex ? honeyInfoColorHex : this.honeyInfoColorHex
            this.weatherInfoColorHex = weatherInfoColorHex ? weatherInfoColorHex : this.weatherInfoColorHex
            this.batteryInfoColorHex = batteryInfoColorHex ? batteryInfoColorHex : this.batteryInfoColorHex
            this.yearProgressColorHex = yearProgressColorHex ? yearProgressColorHex : this.yearProgressColorHex
        } catch (error) {
            console.log(error)
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
                    textColor: this.isRandomColor ? new Color(Utils.randomColor16()) : this.widgetColor,
                    font: new Font('Menlo', 11),
                    textAlign: 'left'
                },
                `[🤖]Hi, ${this.userName}. Good ${this.getDayHourGreetings(time)}`
            ),
            /* @__PURE__ */ h(
                'wtext',
                {
                    textColor: new Color(this.lunarInfoColorHex),
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
                    textColor: new Color(this.honeyInfoColorHex),
                    font: new Font('Menlo', 11),
                    textAlign: 'left',
                    maxLine: 1
                },
                `[🐷]${this.honeyInfo.ishan}`
            ),
            /* @__PURE__ */ h(
                'wtext',
                {
                    textColor: new Color(this.weatherInfoColorHex),
                    font: new Font('Menlo', 11),
                    textAlign: 'left'
                },
                `[🌤]${this.areaInfo.result.address_component.city}·${this.areaInfo.result.address_component.district} ${this.weatherInfo.now.text} T:${this.weatherInfo.now.temp}°  F:${this.weatherInfo.now.feelsLike}° ${this.weatherInfo.now.windDir}`
            ),
            /* @__PURE__ */ h(
                'wtext',
                {
                    textColor: new Color(this.batteryInfoColorHex),
                    font: new Font('Menlo', 11),
                    textAlign: 'left'
                },
                `[${Device.isCharging() ? '⚡️' : '🔋'}]${this.renderBattery()} Battery`
            ),
            /* @__PURE__ */ h(
                'wtext',
                {
                    textColor: new Color(this.yearProgressColorHex),
                    font: new Font('Menlo', 11),
                    textAlign: 'left'
                },
                `[⏳]${this.renderYearProgress()} YearProgress`
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
