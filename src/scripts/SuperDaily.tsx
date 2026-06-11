// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: calendar-alt;

/*
 * author   :  seiun
 * date     :  2021/10/18
 * desc     :  日期助手，回答今天是不是周五，并展示本周进度
 * version  :  1.1.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

import type {SeiunEnv} from '@app/env/types'

declare const importModule: (moduleName: string) => SeiunEnv

type SettingValue<T> = {
    val: T
    type: string
}

type SuperDailySettings = {
    displaySettings: {
        accentColor: SettingValue<string>
        fridayMessage: SettingValue<string>
        normalMessage: SettingValue<string>
        holidayMode: SettingValue<boolean>
        assetBaseUrl: SettingValue<string>
    }
    debugSettings: {
        debugTheme: SettingValue<string>
    }
}

type DayInfo = {
    today: Date
    dayIndex: number
    weekDayText: string
    dateText: string
    isFriday: boolean
    daysToFriday: number
    progress: number
}

type HolidayYearData = {
    holidays?: Record<string, string>
    workdays?: Record<string, string>
    inLieuDays?: Record<string, string>
}

type SolarTermTheme = {
    name: string
    slug: string
    emoji: string
    accentColor: string
    subtitle: string
}

type SolarTermDateRule = {
    name: string
    month: number
    c: number
}

type SpecialDayTheme = {
    name: string
    title: string
    type: 'holiday' | 'workday' | 'solarTerm'
    emoji: string
    accentColor: string
    subtitle: string
    imageUrl?: string
    isDebug?: boolean
}

const dependencyFileName = 'Seiun.Env.js'
const runtimeRequire = typeof require === 'undefined' ? importModule : require
const {WidgetBase, Runing, Utils, GenrateView, h} = runtimeRequire(dependencyFileName) as SeiunEnv

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const weekDayEmojis = ['🌙', '☕️', '🛠️', '📌', '🫠', '😎', '🌈']
const fridayIndex = 5
const defaultAssetBaseUrl = 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Application/Superdaily'
const debugThemeNone = '无'

const holidayAssetMap: Record<string, {slug: string; emoji: string; accentColor: string; subtitle: string}> = {
    元旦: {slug: 'new-year', emoji: '🎆', accentColor: '#F6C453', subtitle: '新的一年，先把今天过亮一点。'},
    春节: {slug: 'spring-festival', emoji: '🧧', accentColor: '#E53935', subtitle: '热闹归位，愿望也归位。'},
    清明: {slug: 'qingming', emoji: '🌿', accentColor: '#7CB342', subtitle: '草木有信，心事放轻。'},
    劳动节: {slug: 'labour-day', emoji: '🛠️', accentColor: '#FF9500', subtitle: '认真生活的人，今天也值得休息。'},
    端午: {slug: 'dragon-boat', emoji: '🐉', accentColor: '#2E7D32', subtitle: '粽叶清香，夏天开场。'},
    中秋: {slug: 'mid-autumn', emoji: '🌕', accentColor: '#F6C453', subtitle: '月亮在线，心也该回家。'},
    国庆节: {slug: 'national-day', emoji: '⭐️', accentColor: '#E53935', subtitle: '把今天过得热烈一点。'},
    国庆: {slug: 'national-day', emoji: '⭐️', accentColor: '#E53935', subtitle: '把今天过得热烈一点。'},
}

const solarTerms: SolarTermTheme[] = [
    {name: '立春', slug: 'lichun', emoji: '🌱', accentColor: '#78C850', subtitle: '春天开始发芽。'},
    {name: '雨水', slug: 'yushui', emoji: '🌧️', accentColor: '#4A90E2', subtitle: '一场细雨，把春意叫醒。'},
    {name: '惊蛰', slug: 'jingzhe', emoji: '⚡️', accentColor: '#8E6BE8', subtitle: '雷声很远，生机很近。'},
    {name: '春分', slug: 'chunfen', emoji: '🌗', accentColor: '#F4A7B9', subtitle: '昼夜平分，心也放平。'},
    {name: '清明', slug: 'qingming', emoji: '🌿', accentColor: '#7CB342', subtitle: '雨落青山，草木清亮。'},
    {name: '谷雨', slug: 'guyu', emoji: '🍵', accentColor: '#8BC34A', subtitle: '雨生百谷，万物慢慢丰盈。'},
    {name: '立夏', slug: 'lixia', emoji: '🌤️', accentColor: '#00A884', subtitle: '夏天轻轻推门。'},
    {name: '小满', slug: 'xiaoman', emoji: '🌾', accentColor: '#C6A15B', subtitle: '未满刚好，继续生长。'},
    {name: '芒种', slug: 'mangzhong', emoji: '🌾', accentColor: '#D99A2B', subtitle: '忙有所得，种有回声。'},
    {name: '夏至', slug: 'xiazhi', emoji: '☀️', accentColor: '#FFB000', subtitle: '白昼最长，热烈正好。'},
    {name: '小暑', slug: 'xiaoshu', emoji: '🍉', accentColor: '#FF7A45', subtitle: '风开始热，心可以凉一点。'},
    {name: '大暑', slug: 'dashu', emoji: '🔥', accentColor: '#FF4D4F', subtitle: '盛夏到顶，记得纳凉。'},
    {name: '立秋', slug: 'liqiu', emoji: '🍂', accentColor: '#D98C3F', subtitle: '秋天在风里露了个面。'},
    {name: '处暑', slug: 'chushu', emoji: '🌬️', accentColor: '#5DADE2', subtitle: '暑气退场，清风接班。'},
    {name: '白露', slug: 'bailu', emoji: '💧', accentColor: '#9AD7F5', subtitle: '露水微凉，秋意变清。'},
    {name: '秋分', slug: 'qiufen', emoji: '🌗', accentColor: '#D9A441', subtitle: '昼夜再平分，收获也近了。'},
    {name: '寒露', slug: 'hanlu', emoji: '🍁', accentColor: '#8E6F4E', subtitle: '露意转寒，晚秋入场。'},
    {name: '霜降', slug: 'shuangjiang', emoji: '❄️', accentColor: '#7D9CB8', subtitle: '霜落之后，秋天更深。'},
    {name: '立冬', slug: 'lidong', emoji: '🫖', accentColor: '#6E8CA8', subtitle: '冬天开始，热茶上线。'},
    {name: '小雪', slug: 'xiaoxue', emoji: '🌨️', accentColor: '#8FB8D8', subtitle: '小雪初落，世界安静一点。'},
    {name: '大雪', slug: 'daxue', emoji: '🏔️', accentColor: '#6F91B8', subtitle: '雪意渐盛，适合慢下来。'},
    {name: '冬至', slug: 'dongzhi', emoji: '🥣', accentColor: '#F6C453', subtitle: '夜最长，暖意也最该靠近。'},
    {name: '小寒', slug: 'xiaohan', emoji: '🌸', accentColor: '#A8C8F0', subtitle: '寒意轻敲，梅花先回信。'},
    {name: '大寒', slug: 'dahan', emoji: '🧊', accentColor: '#8CAAE6', subtitle: '寒到极处，春天就在路上。'},
]

const solarTermDateRules: SolarTermDateRule[] = [
    {name: '小寒', month: 1, c: 5.4055},
    {name: '大寒', month: 1, c: 20.12},
    {name: '立春', month: 2, c: 3.87},
    {name: '雨水', month: 2, c: 18.73},
    {name: '惊蛰', month: 3, c: 5.63},
    {name: '春分', month: 3, c: 20.646},
    {name: '清明', month: 4, c: 4.81},
    {name: '谷雨', month: 4, c: 20.1},
    {name: '立夏', month: 5, c: 5.52},
    {name: '小满', month: 5, c: 21.04},
    {name: '芒种', month: 6, c: 5.678},
    {name: '夏至', month: 6, c: 21.37},
    {name: '小暑', month: 7, c: 7.108},
    {name: '大暑', month: 7, c: 22.83},
    {name: '立秋', month: 8, c: 7.5},
    {name: '处暑', month: 8, c: 23.13},
    {name: '白露', month: 9, c: 7.646},
    {name: '秋分', month: 9, c: 23.042},
    {name: '寒露', month: 10, c: 8.318},
    {name: '霜降', month: 10, c: 23.438},
    {name: '立冬', month: 11, c: 7.438},
    {name: '小雪', month: 11, c: 22.36},
    {name: '大雪', month: 12, c: 7.18},
    {name: '冬至', month: 12, c: 21.94},
]

const debugThemeOptions = [
    {label: debugThemeNone, value: debugThemeNone},
    {label: '补班', value: 'workday:补班'},
    ...Object.keys(holidayAssetMap)
        .filter(name => name !== '国庆')
        .map(name => ({label: name, value: `holiday:${name}`})),
    ...solarTerms.map(term => ({label: term.name, value: `solarTerm:${term.name}`})),
]

class SuperDaily extends WidgetBase {
    name = '日期助手'
    en = 'SuperDaily'
    widgetParam = args.widgetParameter

    currentSettings: SuperDailySettings = {
        displaySettings: {
            accentColor: {val: '#F79709', type: this.settingValTypeString},
            fridayMessage: {val: '是，今天可以轻一点。', type: this.settingValTypeString},
            normalMessage: {val: '还不是，再稳稳推进一下。', type: this.settingValTypeString},
            holidayMode: {val: true, type: this.settingValTypeBool},
            assetBaseUrl: {val: defaultAssetBaseUrl, type: this.settingValTypeString},
        },
        debugSettings: {
            debugTheme: {val: debugThemeNone, type: this.settingValTypeString},
        },
    }

    constructor(scriptName?: string) {
        super(scriptName)
        this.Run()
    }

    getDisplaySettingItems() {
        return [
            {
                title: '强调色',
                desc: '用于周五答案、进度条和日期点缀',
                icon: {name: 'paintpalette', color: '#F79709'},
                type: 'color',
                option: {accentColor: '#F79709'},
            },
            {
                title: '周五文案',
                desc: '今天是周五时显示',
                icon: {name: 'sun.max', color: '#FFB000'},
                type: 'text',
                option: {fridayMessage: '是，今天可以轻一点。'},
                config: {
                    placeholder: '是，今天可以轻一点。',
                    style: 'compact',
                },
            },
            {
                title: '非周五文案',
                desc: '今天不是周五时显示',
                icon: {name: 'calendar.badge.clock', color: '#32ADE6'},
                type: 'text',
                option: {normalMessage: '还不是，再稳稳推进一下。'},
                config: {
                    placeholder: '还不是，再稳稳推进一下。',
                    style: 'compact',
                },
            },
            {
                title: '节假日模式',
                desc: '命中法定节假日、补班或二十四节气时切换主题图',
                icon: {name: 'sparkles', color: '#FFB000'},
                type: 'switch',
                option: {holidayMode: true},
            },
            {
                title: '主题图 CDN',
                desc: '节假日主题图根地址',
                icon: {name: 'photo.on.rectangle', color: '#34C759'},
                type: 'text',
                option: {assetBaseUrl: defaultAssetBaseUrl},
                config: {
                    placeholder: defaultAssetBaseUrl,
                    style: 'compact',
                    truncateLength: -1,
                },
            },
        ]
    }

    getDebugSettingItems() {
        return [
            {
                title: '模拟主题日',
                desc: '选择后强制显示某个节假日或节气；选择“无”则按真实日期显示',
                icon: {name: 'ladybug', color: '#AF52DE'},
                type: 'select',
                option: {debugTheme: debugThemeNone},
                config: {
                    selectOptions: debugThemeOptions,
                    defaultShowContent: debugThemeNone,
                    multiple: false,
                    editable: false,
                },
            },
        ]
    }

    getHomeSettingItems() {
        const withSaveCategory = (items: ReturnType<SuperDaily['getDisplaySettingItems']>, saveCategory: string) =>
            items.map(item => ({...item, saveCategory}))

        return [
            ...withSaveCategory(this.getDisplaySettingItems(), 'displaySettings'),
            ...withSaveCategory(this.getDebugSettingItems(), 'debugSettings'),
        ]
    }

    Run() {
        if (!config.runsInApp) return

        this.registerSetting(this.getHomeSettingItems())
        this.registerSettingCategory('displaySettings', '显示设置', this.getDisplaySettingItems())
        this.registerSettingCategory('debugSettings', '调试设置', this.getDebugSettingItems())

    }

    getRenderDate() {
        const value = String(this.widgetParam || '').trim()
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
        if (!match) return new Date()

        const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        return Number.isNaN(date.getTime()) ? new Date() : date
    }

    getDayInfo(): DayInfo {
        const today = this.getRenderDate()
        const dayIndex = today.getDay()
        const daysToFriday = (fridayIndex - dayIndex + 7) % 7
        const workWeekIndex = dayIndex === 0 ? 7 : dayIndex
        const progress = Math.min(Math.max(workWeekIndex / 5, 0), 1)
        const month = today.getMonth() + 1
        const date = today.getDate()

        return {
            today,
            dayIndex,
            weekDayText: weekDays[dayIndex],
            dateText: `${month}月${date}日`,
            isFriday: dayIndex === fridayIndex,
            daysToFriday,
            progress,
        }
    }

    getAccentColor() {
        return new Color(this.currentSettings.displaySettings.accentColor.val || '#F79709')
    }

    getAssetBaseUrl() {
        return (this.currentSettings.displaySettings.assetBaseUrl.val || defaultAssetBaseUrl).replace(/\/$/, '')
    }

    getDebugThemeKey() {
        return String(this.currentSettings.debugSettings.debugTheme.val || debugThemeNone)
    }

    buildHolidayTheme(name: string, isDebug = false): SpecialDayTheme | null {
        const asset = holidayAssetMap[name]
        if (!asset) return null

        return {
            name,
            title: name,
            type: 'holiday',
            emoji: asset.emoji,
            accentColor: asset.accentColor,
            subtitle: asset.subtitle,
            imageUrl: `${this.getAssetBaseUrl()}/holidays/${asset.slug}.png`,
            isDebug,
        }
    }

    buildSolarTermTheme(theme: SolarTermTheme, isDebug = false): SpecialDayTheme {
        return {
            name: theme.name,
            title: theme.name,
            type: 'solarTerm',
            emoji: theme.emoji,
            accentColor: theme.accentColor,
            subtitle: theme.subtitle,
            imageUrl: `${this.getAssetBaseUrl()}/solar-terms/${theme.slug}.png`,
            isDebug,
        }
    }

    getDebugSpecialDayTheme(): SpecialDayTheme | null {
        const debugTheme = this.getDebugThemeKey()
        if (!debugTheme || debugTheme === debugThemeNone) return null

        const [type, name] = debugTheme.split(':')
        if (type === 'workday') {
            return {
                name: '补班',
                title: '补班模式',
                type: 'workday',
                emoji: '😵‍💫',
                accentColor: '#8E8E93',
                subtitle: '调休补班模拟：早点收工也算胜利。',
                isDebug: true,
            }
        }

        if (type === 'holiday') return this.buildHolidayTheme(name, true)

        if (type === 'solarTerm') {
            const solarTerm = solarTerms.find(item => item.name === name)
            return solarTerm ? this.buildSolarTermTheme(solarTerm, true) : null
        }

        return null
    }

    getDynamicColor(light: string, dark: string) {
        return Color.dynamic(new Color(light), new Color(dark))
    }

    getDateKey(date: Date) {
        const year = date.getFullYear()
        const month = `${date.getMonth() + 1}`.padStart(2, '0')
        const day = `${date.getDate()}`.padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    parseChineseDaysValue(value?: string) {
        const parts = String(value || '').split(',')
        return {
            en: parts[0] || '',
            name: parts[1] || '',
            days: Number(parts[2] || 0),
        }
    }

    async getHolidayYearData(year: number) {
        const cacheKey = `holiday-year-${year}`
        const cached = this.storage.getStorage<HolidayYearData>(cacheKey, 1440)
        if (cached) return cached

        try {
            const data = await this.$request.get<HolidayYearData>(`https://cdn.jsdelivr.net/npm/chinese-days/dist/years/${year}.json`)
            if (data && (data.holidays || data.workdays)) {
                this.storage.setStorage(cacheKey, data)
                return data
            }
        } catch (error) {
            console.log(`[SuperDaily] 节假日数据请求失败：${error}`)
        }

        return this.storage.getStorage<HolidayYearData>(cacheKey) || {}
    }

    getSolarTermDate(year: number, rule: SolarTermDateRule) {
        const yearInCentury = year % 100
        const day = Math.floor(yearInCentury * 0.2422 + rule.c) - Math.floor((yearInCentury - 1) / 4)
        const month = rule.month
        return `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`
    }

    getSolarTermTheme(date: Date): SolarTermTheme | null {
        const dateKey = this.getDateKey(date)
        const year = date.getFullYear()
        const rule = solarTermDateRules.find(item => this.getSolarTermDate(year, item) === dateKey)
        return rule ? solarTerms.find(item => item.name === rule.name) || null : null
    }

    async getSpecialDayTheme(info: DayInfo): Promise<SpecialDayTheme | null> {
        if (!this.currentSettings.displaySettings.holidayMode.val) return null

        const debugTheme = this.getDebugSpecialDayTheme()
        if (debugTheme) return debugTheme

        const dateKey = this.getDateKey(info.today)
        const yearData = await this.getHolidayYearData(info.today.getFullYear())

        if (yearData.workdays?.[dateKey]) {
            const workday = this.parseChineseDaysValue(yearData.workdays[dateKey])
            return {
                name: workday.name || '补班',
                title: '补班模式',
                type: 'workday',
                emoji: '😵‍💫',
                accentColor: '#8E8E93',
                subtitle: `${workday.name || '假期'}调休补班，早点收工也算胜利。`,
            }
        }

        if (yearData.holidays?.[dateKey]) {
            const holiday = this.parseChineseDaysValue(yearData.holidays[dateKey])
            const holidayTheme = this.buildHolidayTheme(holiday.name)
            if (holidayTheme) return holidayTheme

            return {
                name: holiday.name || '节假日',
                title: holiday.name || '节假日',
                type: 'holiday',
                emoji: '🎈',
                accentColor: '#F79709',
                subtitle: '今天有一点不同，值得好好过。',
            }
        }

        const solarTerm = this.getSolarTermTheme(info.today)
        if (solarTerm) {
            return this.buildSolarTermTheme(solarTerm)
        }

        return null
    }

    getAnswerText(info: DayInfo) {
        return info.isFriday ? '是' : '不是'
    }

    getAnswerEmoji(info: DayInfo) {
        return info.isFriday ? '😎' : info.daysToFriday === 1 ? '🫠' : '⏳'
    }

    getWeekDayEmoji(info: DayInfo) {
        return weekDayEmojis[info.dayIndex] || '🗓️'
    }

    getMoodText(info: DayInfo) {
        if (info.isFriday) return `🎉 ${this.currentSettings.displaySettings.fridayMessage.val}`
        if (info.daysToFriday === 1) return '🫡 明天就是周五，撑住最后一格。'
        return `💪 ${this.currentSettings.displaySettings.normalMessage.val}`
    }

    getCountdownText(info: DayInfo) {
        if (info.isFriday) return '🎉 周五已抵达'
        if (info.daysToFriday === 1) return '⏳ 距离周五 1 天'
        return `⏳ 距离周五 ${info.daysToFriday} 天`
    }

    getCalendarUrl(info: DayInfo) {
        const year = info.today.getFullYear()
        const month = `${info.today.getMonth() + 1}`.padStart(2, '0')
        const date = `${info.today.getDate()}`.padStart(2, '0')
        return `calshow:${year}${month}${date}`
    }

    renderWeekDots(info: DayInfo, accentColor: Color, dotSize: number) {
        return [1, 2, 3, 4, 5].map(day => (
            <wstack
                width={dotSize}
                height={dotSize}
                borderRadius={dotSize / 2}
                background={day <= Math.min(info.dayIndex || 7, 5) ? accentColor : this.getDynamicColor('#E5E5EA', '#3A3A3C')}
            />
        ))
    }

    renderProgressBar(info: DayInfo, accentColor: Color, width: number) {
        const progressWidth = Math.max(6, Math.round(width * info.progress))
        return (
            <wstack width={width} height={8} borderRadius={4} background={this.getDynamicColor('#E5E5EA', '#3A3A3C')}>
                <wstack width={progressWidth} height={8} borderRadius={4} background={accentColor} />
            </wstack>
        )
    }

    async getThemeBackground(theme: SpecialDayTheme) {
        if (!theme.imageUrl) return this.backGroundColor

        const image = await this.getImageByUrl(theme.imageUrl, null, `superdaily-${theme.type}-${theme.name}`)
        if (!image) return this.backGroundColor

        return await this.shadowImage(image, '#000000', 0.32)
    }

    async renderSpecialSmall(widget: ListWidget, info: DayInfo, theme: SpecialDayTheme) {
        const accentColor = new Color(theme.accentColor)
        const background = await this.getThemeBackground(theme)
        const textColor = theme.imageUrl ? Color.white() : this.widgetColor
        GenrateView.setListWidget(widget)

        return (
            <wbox background={background} spacing={6} padding={[12, 12, 12, 12]} href={this.getCalendarUrl(info)}>
                <wstack verticalAlign="center">
                    <wtext textColor={textColor} font={Font.mediumSystemFont(12)} opacity={0.72}>
                        {`${theme.emoji} ${theme.isDebug ? '调试预览' : theme.type === 'workday' ? '今天要上班' : '今日主题'}`}
                    </wtext>
                    <wspacer />
                    <wtext textColor={accentColor} font={Font.mediumSystemFont(12)} maxLine={1}>
                        {info.weekDayText}
                    </wtext>
                </wstack>
                <wspacer />
                <wtext textColor={accentColor} font={Font.boldSystemFont(34)} maxLine={1} scale={0.65}>
                    {theme.title}
                </wtext>
                <wtext textColor={textColor} font={Font.systemFont(12)} opacity={0.76} maxLine={2} scale={0.72}>
                    {theme.subtitle}
                </wtext>
                <wspacer />
                <wtext textColor={textColor} font={Font.mediumSystemFont(11)} opacity={0.62}>
                    {`${info.dateText} · ${info.weekDayText} ${this.getWeekDayEmoji(info)}`}
                </wtext>
            </wbox>
        )
    }

    async renderSpecialCommon(widget: ListWidget, info: DayInfo, theme: SpecialDayTheme) {
        const accentColor = new Color(theme.accentColor)
        const background = await this.getThemeBackground(theme)
        const textColor = theme.imageUrl ? Color.white() : this.widgetColor
        const isLarge = this.widgetFamily === 'large'
        GenrateView.setListWidget(widget)

        return (
            <wbox background={background} spacing={isLarge ? 12 : 8} padding={[14, 14, 14, 14]} href={this.getCalendarUrl(info)}>
                <wstack verticalAlign="center">
                    <wtext textColor={textColor} font={Font.mediumSystemFont(13)} opacity={0.72}>
                        {`${theme.emoji} ${info.dateText} · ${info.weekDayText}`}
                    </wtext>
                    <wspacer />
                    <wtext textColor={accentColor} font={Font.mediumSystemFont(12)} opacity={0.95}>
                        {theme.isDebug ? '调试预览' : theme.type === 'solarTerm' ? '二十四节气' : theme.type === 'workday' ? '调休补班' : '节假日'}
                    </wtext>
                </wstack>

                <wspacer />

                <wstack verticalAlign="bottom">
                    <wstack flexDirection="column">
                        <wtext textColor={textColor} font={Font.boldSystemFont(isLarge ? 18 : 16)} opacity={0.76}>
                            {theme.type === 'workday' ? '今天不是假期' : '今天有点特别'}
                        </wtext>
                        <wspacer length={4} />
                        <wtext textColor={accentColor} font={Font.boldSystemFont(isLarge ? 58 : 46)} maxLine={1} scale={0.62}>
                            {`${theme.title} ${theme.emoji}`}
                        </wtext>
                    </wstack>
                    <wspacer />
                    <wstack flexDirection="column" verticalAlign="bottom">
                        <wtext textColor={textColor} font={Font.systemFont(isLarge ? 15 : 13)} opacity={0.78} textAlign="right" maxLine={2} scale={0.72}>
                            {theme.subtitle}
                        </wtext>
                    </wstack>
                </wstack>

                <wspacer />

                <wstack verticalAlign="center">
                    <wimage src={theme.type === 'workday' ? 'briefcase' : 'sparkles'} width={12} height={12} filter={accentColor} opacity={0.9} />
                    <wspacer length={5} />
                    <wtext textColor={textColor} font={Font.systemFont(11)} opacity={0.62} maxLine={1}>
                        {theme.isDebug ? '设置页模拟主题' : theme.type === 'workday' ? '补班日也要留点余裕' : '主题图来自 SuperDaily CDN'}
                    </wtext>
                    <wspacer />
                    <wtext textColor={textColor} font={Font.systemFont(11)} opacity={0.5} textAlign="right">
                        {Utils.time('HH:mm')}
                    </wtext>
                </wstack>
            </wbox>
        )
    }

    async renderSmall(widget: ListWidget, info: DayInfo) {
        const accentColor = this.getAccentColor()
        GenrateView.setListWidget(widget)

        return (
            <wbox background={this.backGroundColor} spacing={6} padding={[12, 12, 12, 12]} href={this.getCalendarUrl(info)}>
                <wstack verticalAlign="center">
                    <wtext textColor={this.widgetColor} font={Font.mediumSystemFont(12)} opacity={0.6}>
                        🗓️ 今天是周五吗
                    </wtext>
                    <wspacer />
                    <wtext textColor={accentColor} font={Font.mediumSystemFont(12)}>
                        {`${info.weekDayText} ${this.getWeekDayEmoji(info)}`}
                    </wtext>
                </wstack>
                <wspacer />
                <wtext textColor={info.isFriday ? accentColor : this.widgetColor} font={Font.boldSystemFont(36)} maxLine={1} scale={0.7}>
                    {`${this.getAnswerText(info)} ${this.getAnswerEmoji(info)}`}
                </wtext>
                <wtext textColor={this.widgetColor} font={Font.systemFont(12)} opacity={0.58} maxLine={2} scale={0.75}>
                    {this.getCountdownText(info)}
                </wtext>
                <wspacer />
                <wstack spacing={5}>{this.renderWeekDots(info, accentColor, 9)}</wstack>
            </wbox>
        )
    }

    async renderCommon(widget: ListWidget, info: DayInfo) {
        const accentColor = this.getAccentColor()
        const isLarge = this.widgetFamily === 'large'
        const progressWidth = isLarge ? 255 : 205
        GenrateView.setListWidget(widget)

        return (
            <wbox background={this.backGroundColor} spacing={isLarge ? 12 : 8} padding={[14, 14, 14, 14]} href={this.getCalendarUrl(info)}>
                <wstack verticalAlign="center">
                    <wimage src="calendar" width={16} height={16} filter={accentColor} opacity={0.9} />
                    <wspacer length={6} />
                    <wtext textColor={this.widgetColor} font={Font.mediumSystemFont(13)} opacity={0.65}>
                        {`${this.getWeekDayEmoji(info)} ${info.dateText} · ${info.weekDayText}`}
                    </wtext>
                    <wspacer />
                    <wtext textColor={accentColor} font={Font.mediumSystemFont(12)} opacity={0.9}>
                        {this.getCountdownText(info)}
                    </wtext>
                </wstack>

                <wspacer />

                <wstack verticalAlign="bottom">
                    <wstack flexDirection="column">
                        <wtext textColor={this.widgetColor} font={Font.boldSystemFont(isLarge ? 20 : 18)} opacity={0.72}>
                            🗓️ 今天是周五吗？
                        </wtext>
                        <wspacer length={4} />
                        <wtext textColor={info.isFriday ? accentColor : this.widgetColor} font={Font.boldSystemFont(isLarge ? 68 : 54)} maxLine={1} scale={0.7}>
                            {`${this.getAnswerText(info)} ${this.getAnswerEmoji(info)}`}
                        </wtext>
                    </wstack>
                    <wspacer />
                    <wstack flexDirection="column" verticalAlign="bottom">
                        <wtext textColor={this.widgetColor} font={Font.systemFont(isLarge ? 15 : 13)} opacity={0.7} textAlign="right" maxLine={2} scale={0.72}>
                            {this.getMoodText(info)}
                        </wtext>
                    </wstack>
                </wstack>

                <wspacer />

                <wstack verticalAlign="center">
                    <wstack spacing={6}>{this.renderWeekDots(info, accentColor, isLarge ? 12 : 10)}</wstack>
                    <wspacer />
                    <wtext textColor={this.widgetColor} font={Font.systemFont(11)} opacity={0.45} textAlign="right">
                        🚀 工作周进度 {Math.round(info.progress * 100)}%
                    </wtext>
                </wstack>
                {this.renderProgressBar(info, accentColor, progressWidth)}
            </wbox>
        )
    }

    async render() {
        const widget = new ListWidget()
        await this.getWidgetBackgroundImage(widget)
        const info = this.getDayInfo()
        const specialDayTheme = await this.getSpecialDayTheme(info)

        switch (this.widgetFamily) {
            case 'small':
                if (specialDayTheme) await this.renderSpecialSmall(widget, info, specialDayTheme)
                else await this.renderSmall(widget, info)
                break
            case 'medium':
                if (specialDayTheme) await this.renderSpecialCommon(widget, info, specialDayTheme)
                else await this.renderCommon(widget, info)
                break
            case 'large':
                if (specialDayTheme) await this.renderSpecialCommon(widget, info, specialDayTheme)
                else await this.renderCommon(widget, info)
                break
            default:
                await Utils.renderUnsupport(widget)
                break
        }

        return widget
    }
}

EndAwait(() => Runing(SuperDaily, args.widgetParameter, false))
