// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: film;

/*
 * author   :  seiun
 * date     :  2025/12/26
 * desc     :  电影日历
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable
 * changelog:
 */

if (typeof require === 'undefined') require = importModule
const { WidgetBase, Runing, GenrateView, h, Utils } = require('./Seiun.Env')

class Widget extends WidgetBase {
    constructor(arg) {
        super(arg)
        this.name = '电影日历'
        this.en = 'MovieCalendar'
        this.storageExpirationMinutes = 30
        this.domain = 'https://www.cikeee.com'
        this.Run()
    }

    httpData = null
    isRequestSuccess = false

    currentSettings = {
        basicSettings: {
            refreshInterval: {val: '120', type: this.settingValTypeString},
        },
        displaySettings: {
            descColor: {val: '#EEEEEE', type: this.settingValTypeString},
            titleColor: {val: '#FFFFFF', type: this.settingValTypeString},
            subTitleColor: {val: '#CCCCCC', type: this.settingValTypeString},
            timeColor: {val: '#FFFFFF', type: this.settingValTypeString},
            autoTimeColor: {val: false, type: this.settingValTypeBool},
        },
    }

    getWidgetSize(name) {
        const sizes = {
            '小号': {width: 155, height: 155},
            '中号': {width: 329, height: 155},
            '大号': {width: 329, height: 345},
        }
        return sizes[name] || sizes['大号']
    }

    getSFSymbol(name) {
        const symbol = SFSymbol.named(name)
        return symbol ? symbol.image : null
    }

    async analyzeImageColor(img) {
        if (!img) return new Color('#FFFFFF')
        
        try {
            const base64 = Data.fromPNG(img).toBase64String()
            const webview = new WebView()
            await webview.loadHTML(`
                <canvas id="canvas"></canvas>
                <script>
                    const canvas = document.getElementById('canvas')
                    const ctx = canvas.getContext('2d')
                    const img = new Image()
                    img.onload = () => {
                        canvas.width = Math.min(img.width, 100)
                        canvas.height = Math.min(img.height, 100)
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                        const data = imageData.data
                        let r = 0, g = 0, b = 0, count = 0
                        for (let i = 0; i < data.length; i += 16) {
                            r += data[i]
                            g += data[i + 1]
                            b += data[i + 2]
                            count++
                        }
                        r = Math.floor(r / count)
                        g = Math.floor(g / count)
                        b = Math.floor(b / count)
                        const brightness = (r * 299 + g * 587 + b * 114) / 1000
                        window.result = brightness > 140 ? '#000000' : '#FFFFFF'
                    }
                    img.src = 'data:image/png;base64,${base64}'
                </script>
            `)
            await new Promise(resolve => Timer.schedule(500, false, resolve))
            const result = await webview.evaluateJavaScript('window.result || "#FFFFFF"')
            return new Color(result || '#FFFFFF')
        } catch (e) {
            console.log(`图片颜色分析失败: ${e}`)
            return new Color('#FFFFFF')
        }
    }

    init = async () => {
        try {
            await this.getMovieData()
            await this.getLunarInfo()
        } catch (e) {
            console.log(e)
        }
    }

    async getLunarInfo() {
        const day = new Date().getDate()
        try {
            const cachedLunar = this.storage.getStorage('lunar')
            if (cachedLunar) {
                this.lunarInfo = cachedLunar
                return cachedLunar
            }

            const requestUrl = 'https://wannianrili.51240.com/'
            const defaultHeaders = {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.67 Safari/537.36'
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

            let response = await webview.evaluateJavaScript(getData, false)
            console.log(`[+]农历请求成功`)
            this.storage.setStorage('lunar', response)
            this.lunarInfo = response
            return response
        } catch (e) {
            console.log(`[+]农历请求出错，尝试使用缓存信息：${e}`)
            this.lunarInfo = this.storage.getStorage('lunar') || {infoLunarText: ''}
            return this.lunarInfo
        }
    }

    async loadHTML(url) {
        const defaultHeaders = {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
        }
        let html = await this.$request.get({ url, headers: defaultHeaders }, 'STRING')
        return html.replace(/(\r\n|\n|\r)/gm, '')
    }

    async getMovieData() {
        const link = this.domain
        const cacheKey = this.md5(link)
        const cacheTimeKey = `${cacheKey}_time`
        const cacheMinutes = 30
        
        const cachedTime = this.storage.getStorage(cacheTimeKey)
        const now = new Date()
        const cachedDate = cachedTime ? new Date(cachedTime) : null
        
        let shouldRefresh = false
        if (cachedDate) {
            const nowDate = now.getDate()
            const cachedDateDay = cachedDate.getDate()
            const nowMonth = now.getMonth()
            const cachedMonth = cachedDate.getMonth()
            const nowYear = now.getFullYear()
            const cachedYear = cachedDate.getFullYear()
            
            if (nowDate !== cachedDateDay || nowMonth !== cachedMonth || nowYear !== cachedYear) {
                shouldRefresh = true
                console.log(`-->>检测到跨天，立即更新数据`)
            } else {
                const diffMinutes = (now - cachedDate) / (1000 * 60)
                if (diffMinutes >= cacheMinutes) {
                    shouldRefresh = true
                }
            }
        } else {
            shouldRefresh = true
        }
        
        const cachedData = this.storage.getStorage(cacheKey)
        if (!shouldRefresh && cachedData) {
            console.log(`-->>加载缓存网页数据：${link}`)
            this.httpData = cachedData
            this.isRequestSuccess = true
            return cachedData
        }

        try {
            console.log(`-->>在线加载网页数据：${link}`)
            let html = await this.loadHTML(link)
            const webview = new WebView()
            await webview.loadHTML(html)
            const getData = `
                function getData() {
                    let movieImg = document.getElementById('movie-img').src;
                    let movieDesc = document.querySelector('span#movie-text').textContent;
                    let movieName = document.querySelector('a#movie-name').textContent.replaceAll('——', '');
                    let movieInformation = document.querySelector('a#movie-information').textContent;
                    let movieRating = movieInformation.slice(0, 3);
                    movieInformation = movieInformation.slice(5);
                    let movieLink = document.querySelector('a#movie-img-a').href;
                    return { movieImg, movieDesc, movieName, movieInformation, movieRating, movieLink };
                }
                getData()
            `
            const response = await webview.evaluateJavaScript(getData, false)
            if (response && response.movieName) {
                if (cachedData && cachedData.movieName !== response.movieName) {
                    console.log(`-->>电影数据已更新，清理旧图片缓存`)
                    if (cachedData.movieImg) {
                        this.storage.removeFile(`${this.domain}${cachedData.movieImg}`, true)
                    }
                }
                this.storage.setStorage(cacheKey, response)
                this.storage.setStorage(cacheTimeKey, now.toISOString())
                this.httpData = response
                this.isRequestSuccess = true
                return response
            }
        } catch (error) {
            console.error(`🚫 请求数据出错了=>${error}`)
            this.isRequestSuccess = false
            const fallbackData = this.storage.getStorage(cacheKey)
            if (fallbackData) {
                this.httpData = fallbackData
                return fallbackData
            }
        }
        return null
    }

    Run() {
        if (config.runsInApp) {
            this.registerSettingCategory('basicSettings', '基础设置', [
                {
                    title: '刷新间隔',
                    desc: '设置数据刷新间隔（分钟）',
                    icon: {name: 'clock', color: '#1890ff'},
                    type: 'text',
                    option: {
                        refreshInterval: '120',
                    },
                    config: {
                        placeholder: '120',
                        style: 'compact',
                    },
                },
            ])

            this.registerSettingCategory('displaySettings', '显示设置', [
                {
                    title: '描述文字颜色',
                    desc: '缺省值: #EEEEEE',
                    icon: {name: 'paintbrush', color: '#1890ff'},
                    type: 'color',
                    option: {
                        descColor: '#EEEEEE',
                    },
                },
                {
                    title: '标题文字颜色',
                    desc: '缺省值: #FFFFFF',
                    icon: {name: 'paintbrush.fill', color: '#722ed1'},
                    type: 'color',
                    option: {
                        titleColor: '#FFFFFF',
                    },
                },
                {
                    title: '副标题文字颜色',
                    desc: '缺省值: #CCCCCC',
                    icon: {name: 'paintbrush.pointed', color: '#52c41a'},
                    type: 'color',
                    option: {
                        subTitleColor: '#CCCCCC',
                    },
                },
                {
                    title: '时间文字颜色',
                    desc: '缺省值: #FFFFFF',
                    icon: {name: 'clock.fill', color: '#999999'},
                    type: 'color',
                    option: {
                        timeColor: '#FFFFFF',
                    },
                },
                {
                    title: '自动分析时间颜色',
                    desc: '根据图片自动计算时间文字颜色',
                    icon: {name: 'wand.and.stars', color: '#FF6B6B'},
                    type: 'switch',
                    option: {
                        autoTimeColor: false,
                    },
                },
            ])

            this.registerSetting({
                title: '参数配置',
                icon: {name: 'gear', color: '#722ed1'},
                onAction: async () => {
                    await this.presentSettings(['basicSettings', 'displaySettings'])
                    return true
                },
            })
        }
    }

    renderCommon = async (w, sizeSplit, descSpan, useMoviePoster4FullBG, name) => {
        if (!this.httpData) {
            GenrateView.setListWidget(w)
            return /* @__PURE__ */ h('wbox', {}, /* @__PURE__ */ h('wtext', { textColor: this.widgetColor }, '加载中...'))
        }

        const { movieImg, movieDesc, movieName, movieInformation, movieRating, movieLink } = this.httpData
        const infoLunarText = this.lunarInfo?.infoLunarText || ''

        const descColor = new Color(this.currentSettings.displaySettings.descColor.val || '#EEEEEE')
        const titleColor = new Color(this.currentSettings.displaySettings.titleColor.val || '#FFFFFF')
        const subTitleColor = new Color(this.currentSettings.displaySettings.subTitleColor.val || '#CCCCCC')

        const widgetSize = this.getWidgetSize(name)
        w.setPadding(0, 0, 0, 0)

        let image = await this.getImageByUrl(`${this.domain}${movieImg}`, null, 'movieCover')
        image = await this.shadowImage(image, '#000000', 0.4)

        let timeColor = new Color(this.currentSettings.displaySettings.timeColor.val || '#FFFFFF')
        if (this.currentSettings.displaySettings.autoTimeColor.val && image) {
            timeColor = await this.analyzeImageColor(image)
        }

        const ratingColor = new Color('#F8D454')
        const emptyStar = SFSymbol.named('star').image
        const fillStar = SFSymbol.named('star.fill').image
        const halfStar = SFSymbol.named('star.leadinghalf.filled').image
        const fillCount = Math.floor(movieRating / 2)
        const remainCount = movieRating / 2 - fillCount
        let totalCount = 0

        const stars = []
        for (let index = 0; index < fillCount; index++) {
            totalCount += 1
            stars.push(/* @__PURE__ */ h('wimage', { src: fillStar, width: 18, height: 18, filter: ratingColor }))
            if (index < fillCount - 1) stars.push(/* @__PURE__ */ h('wspacer', { length: 2 }))
        }

        if (remainCount >= 0.5) {
            totalCount += 1
            stars.push(/* @__PURE__ */ h('wspacer', { length: 2 }))
            stars.push(/* @__PURE__ */ h('wimage', { src: halfStar || emptyStar, width: 18, height: 18, filter: ratingColor }))
        }

        for (let index = 0; index < 5 - totalCount; index++) {
            stars.push(/* @__PURE__ */ h('wspacer', { length: 2 }))
            stars.push(/* @__PURE__ */ h('wimage', { src: emptyStar, width: 18, height: 18, filter: ratingColor, opacity: 0.5 }))
        }

        const currDate = new Date()
        const date = currDate.getDate()
        const month = currDate.toLocaleString('zh-CN', { month: 'long' })
        const week = currDate.toLocaleString('zh-CN', { weekday: 'long' })

        GenrateView.setListWidget(w)
        return /* @__PURE__ */ h(
            'wbox',
            {
                background: useMoviePoster4FullBG ? image : (this.backGroundColor || new Color('#000000')),
                padding: [0, 0, 0, 0],
            },
            /* @__PURE__ */ h(
                'wstack',
                {
                    flexDirection: 'row',
                },
                /* @__PURE__ */ h(
                    'wstack',
                    {
                        flexDirection: 'column',
                        padding: [descSpan, descSpan, descSpan, descSpan],
                        width: widgetSize.width * (1 - sizeSplit),
                        height: widgetSize.height,
                        background: useMoviePoster4FullBG ? null : (this.backGroundColor || new Color('#000000')),
                    },
                    /* @__PURE__ */ h('wtext', { textColor: descColor, font: Font.lightSystemFont(20) }, '❝'),
                    /* @__PURE__ */ h('wtext', { textColor: descColor, font: Font.systemFont(14), opacity: 0.9 }, movieDesc),
                    /* @__PURE__ */ h('wspacer', null),
                    /* @__PURE__ */ h(
                        'wstack',
                        {
                            flexDirection: 'column',
                            href: `${this.domain}${movieLink}`,
                        },
                        /* @__PURE__ */ h('wtext', { textColor: titleColor, font: Font.mediumSystemFont(17) }, movieName),
                        /* @__PURE__ */ h('wspacer', { length: 6 }),
                        /* @__PURE__ */ h(
                            'wstack',
                            {
                                flexDirection: 'row',
                                verticalAlign: 'center',
                            },
                            ...stars,
                            /* @__PURE__ */ h('wspacer', { length: 8 }),
                            /* @__PURE__ */ h('wtext', { textColor: subTitleColor, font: Font.semiboldSystemFont(12) }, `豆瓣评分${movieRating}`)
                        ),
                        /* @__PURE__ */ h('wspacer', { length: 6 }),
                        /* @__PURE__ */ h('wtext', { textColor: subTitleColor, font: Font.semiboldSystemFont(13) }, movieInformation),
                        /* @__PURE__ */ h('wspacer', null)
                    )
                ),
                /* @__PURE__ */ h(
                    'wstack',
                    {
                        flexDirection: 'column',
                        width: widgetSize.width * sizeSplit,
                        height: widgetSize.height,
                        background: useMoviePoster4FullBG ? null : image,
                        verticalAlign: 'center',
                        padding: [10, 10, 10, 10],
                        href: 'https://www.cikeee.com/wangri',
                    },
                    /* @__PURE__ */ h('wtext', { textColor: timeColor, font: Font.semiboldSystemFont(48), textAlign: 'center' }, date < 10 ? `0${date}` : `${date}`),
                    /* @__PURE__ */ h('wspacer', { length: 4 }),
                    /* @__PURE__ */ h('wtext', { textColor: timeColor, font: Font.mediumSystemFont(13), textAlign: 'center' }, `${month} | ${week}`),
                    infoLunarText ? /* @__PURE__ */ h('wspacer', { length: 4 }) : null,
                    infoLunarText ? /* @__PURE__ */ h('wtext', { textColor: timeColor, font: Font.mediumSystemFont(11), textAlign: 'center', minimumScaleFactor: 0.8 }, `农历${infoLunarText}`) : null
                )
            )
        )
    }

    renderSmall = async (w) => {
        return await this.renderCommon(w, 0.4, 2, false, '小号')
    }

    renderMedium = async (w) => {
        return await this.renderCommon(w, 0.35, 10, false, '中号')
    }

    renderLarge = async (w) => {
        return await this.renderCommon(w, 0.3, 16, true, '大号')
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
            default:
                await Utils.renderUnsupport(widget)
                break
        }
        return widget
    }
}

await Runing(Widget, args.widgetParameter, false)
