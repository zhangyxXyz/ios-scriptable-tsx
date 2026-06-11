// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: mobile-alt;

/*
 * author   :  seiun
 * date     :  2026/06/11
 * desc     :  中国联通话费、流量、语音余量小组件
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

import type {SeiunEnv, SettingValue} from '@app/env/types'

declare const importModule: (moduleName: string) => SeiunEnv

type PhoneDataType = 'fee' | 'flow' | 'voice' | 'point' | 'credit' | 'woPay'
type WidgetStyle = '1' | '2' | '3' | '4' | '5' | '6'

type RawPhoneData = {
    type: PhoneDataType
    remainTitle?: string
    usedTitle?: string
    number?: string | number
    unit?: string
    persent?: string | number
}

type ChinaUnicomResponse = {
    code?: string
    data?: {
        dataList?: RawPhoneData[]
    }
}

type UsageItem = {
    type: PhoneDataType
    title: string
    value: number
    displayValue: string
    unit: string
    percent: number
    icon: string
    color: string
}

type ChinaUnicomSettings = {
    actionSettings: {
        cookie: SettingValue<string>
        widgetStyle: SettingValue<WidgetStyle>
        textColor: SettingValue<string>
        flowTotal: SettingValue<number>
        voiceTotal: SettingValue<number>
        refreshMinutes: SettingValue<number>
        showUpdateTime: SettingValue<string>
    }
}

const dependencyFileName = 'Seiun.Env.js'
const runtimeRequire = typeof require === 'undefined' ? importModule : require
const {WidgetBase, Runing, Utils} = runtimeRequire(dependencyFileName) as SeiunEnv

const typeTitle: Record<PhoneDataType, string> = {
    fee: '话费',
    flow: '流量',
    voice: '语音',
    point: '积分',
    credit: '信用分',
    woPay: '电子券',
}

const typeIcon: Record<PhoneDataType, string> = {
    fee: 'yensign.circle.fill',
    flow: 'antenna.radiowaves.left.and.right',
    voice: 'phone.badge.waveform.fill',
    point: 'tag.fill',
    credit: 'checkmark.seal.fill',
    woPay: 'ticket.fill',
}

const typeColor: Record<PhoneDataType, string> = {
    fee: '#F86527',
    flow: '#12A6E4',
    voice: '#30D15B',
    point: '#FC6D6D',
    credit: '#8E6CF6',
    woPay: '#E0A100',
}

const widgetStyleOptions: WidgetStyle[] = ['1', '2', '3', '4', '5', '6']

class ChinaUnicom extends WidgetBase {
    name = '中国联通'
    en = 'ChinaUnicom'
    widgetParam = args.widgetParameter
    logo = 'https://raw.githubusercontent.com/anker1209/icon/main/zglt-big.png'
    smallLogo = 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Application/ChinaUnicom.png'
    isRequestSuccess = false
    errorMessage = ''
    data: UsageItem[] = []
    flowColorHex = '#12A6E4'
    voiceColorHex = '#F86527'
    ringStackSize = 65
    ringTextSize = 14
    feeTextSize = 21
    textSize = 13
    smallPadding = 12
    padding = 10
    logoScale = 0.24
    SCALE = 1
    canvSize = 178
    canvWidth = 18
    canvRadius = 80

    currentSettings: ChinaUnicomSettings = {
        actionSettings: {
            cookie: {val: '', type: this.settingValTypeString},
            widgetStyle: {val: '1', type: this.settingValTypeString},
            textColor: {val: '', type: this.settingValTypeString},
            flowTotal: {val: 0, type: this.settingValTypeFloat},
            voiceTotal: {val: 0, type: this.settingValTypeFloat},
            refreshMinutes: {val: 10, type: this.settingValTypeInt},
            showUpdateTime: {val: '显示', type: this.settingValTypeString},
        },
    }

    constructor(scriptName?: string) {
        super(scriptName)
        this.Run()
    }

    Run() {
        if (!config.runsInApp) return

        this.registerSetting([
            {
                title: 'Cookie',
                desc: '填写中国联通 App 或 BoxJS 抓取到的 cookie',
                icon: {name: 'key.fill', color: '#F86527'},
                type: 'password',
                option: {cookie: ''},
                config: {placeholder: 'cookie'},
            },
            {
                title: '组件样式',
                desc: '缺省值：样式1；组件参数可填 1-6 临时覆盖',
                icon: {name: 'square.grid.2x2.fill', color: '#F86527'},
                type: 'select',
                option: {widgetStyle: '1'},
                config: {
                    selectOptions: [
                        {label: '样式1 卡片', value: '1'},
                        {label: '样式2 列表', value: '2'},
                        {label: '样式3 简洁', value: '3'},
                        {label: '样式4 仪表', value: '4'},
                        {label: '样式5 进度', value: '5'},
                        {label: '样式6 文本', value: '6'},
                    ],
                    defaultShowContent: '样式1 卡片',
                    multiple: false,
                },
            },
            {
                title: '文字颜色',
                desc: '留空时跟随组件主题色',
                icon: {name: 'textformat', color: '#5BD078'},
                type: 'color',
                option: {textColor: ''},
            },
            {
                title: '流量总量',
                desc: '接口没有百分比时使用，单位 GB；0 表示不启用',
                icon: {name: 'chart.pie.fill', color: '#12A6E4'},
                type: 'text',
                option: {flowTotal: '0'},
            },
            {
                title: '语音总量',
                desc: '接口没有百分比时使用，单位分钟；0 表示不启用',
                icon: {name: 'phone.fill', color: '#30D15B'},
                type: 'text',
                option: {voiceTotal: '0'},
            },
            {
                title: '刷新间隔',
                desc: '单位分钟，缺省值：10',
                icon: {name: 'arrow.clockwise', color: '#3478F6'},
                type: 'text',
                option: {refreshMinutes: '10'},
            },
            {
                title: '更新时间',
                desc: '缺省值：显示',
                icon: {name: 'clock', color: '#D11D0C'},
                type: 'select',
                option: {showUpdateTime: '显示'},
                config: {
                    selectOptions: [
                        {label: '显示', value: '显示'},
                        {label: '不显示', value: '不显示'},
                    ],
                    defaultShowContent: '显示',
                    multiple: false,
                },
            },
            {
                title: '从代理缓存读取 Cookie',
                desc: '依次尝试 10010v4 本地缓存和 BoxJS 缓存',
                icon: {name: 'tray.and.arrow.down.fill', color: '#F86527'},
                onAction: async () => {
                    const cookie = await this.getProxyCookie()
                    if (!cookie) {
                        await this.notify('未读取到 Cookie', '请确认代理脚本或 BoxJS 已缓存 @ChinaUnicom.10010v4.cookie')
                        return
                    }
                    this.currentSettings.actionSettings.cookie.val = cookie
                    this.syncCurrentSettings('actionSettings', 'cookie', cookie)
                    this.saveSettings(true)
                },
            },
        ])
    }

    get textColor() {
        const color = this.currentSettings.actionSettings.textColor.val
        return color ? new Color(color) : this.widgetColor
    }

    get widgetStyle() {
        const paramStyle = this.parseWidgetStyle(this.widgetParam)
        return paramStyle || this.currentSettings.actionSettings.widgetStyle.val
    }

    parseWidgetStyle(value?: string | null) {
        if (!value) return null
        const style = value.trim()
        return widgetStyleOptions.includes(style as WidgetStyle) ? (style as WidgetStyle) : null
    }

    cleanCookieStr(str: string) {
        return String(str)
            .split(';')
            .map(item => item.trim().replace(/(^Domain\s*?=\s*?.+?$|^Path\s*?=\s*?.+?\s*?(,\s*|$))/gi, ''))
            .filter(Boolean)
            .join('; ')
    }

    async requestJSON<T>(url: string, headers: Record<string, string> = {}) {
        const req = new Request(url)
        req.timeoutInterval = 10
        req.method = 'GET'
        req.headers = headers
        return (await req.loadJSON()) as T
    }

    async getProxyCookie() {
        const realtimeCookie = await this.requestJSON<{cookie?: string}>('http://10010v4.com/data')
            .then(res => res.cookie)
            .catch(error => {
                console.log(error)
                return ''
            })
        if (realtimeCookie) return this.cleanCookieStr(realtimeCookie)

        const boxjsCookie = await this.requestJSON<{val?: string}>(
            'https://boxjs.com/query/data/@ChinaUnicom.10010v4.cookie',
        )
            .then(res => res.val)
            .catch(error => {
                console.log(error)
                return ''
            })
        return boxjsCookie ? this.cleanCookieStr(boxjsCookie) : ''
    }

    getPercent(item: RawPhoneData, value: number) {
        const rawPercent = Number(item.persent)
        if (!Number.isNaN(rawPercent) && rawPercent > 0) return Math.max(0, Math.min(100, 100 - rawPercent))

        const usedTitle = item.usedTitle || ''
        const usedMatch = usedTitle.match(/已用([\d.]+)%/)
        if (usedMatch) return Math.max(0, Math.min(100, 100 - Number(usedMatch[1])))
        const remainMatch = usedTitle.match(/剩余([\d.]+)%/)
        if (remainMatch) return Math.max(0, Math.min(100, Number(remainMatch[1])))

        if (item.type === 'flow') {
            const total = Number(this.currentSettings.actionSettings.flowTotal.val)
            if (total > 0) return Math.max(0, Math.min(100, (this.toGB(value, item.unit || '') / total) * 100))
        }

        if (item.type === 'voice') {
            const total = Number(this.currentSettings.actionSettings.voiceTotal.val)
            if (total > 0) return Math.max(0, Math.min(100, (value / total) * 100))
        }

        return item.type === 'fee' || item.type === 'point' ? 100 : 0
    }

    toGB(value: number, unit: string) {
        const normalizedUnit = unit.toUpperCase()
        if (normalizedUnit.includes('TB')) return value * 1024
        if (normalizedUnit.includes('MB')) return value / 1024
        if (normalizedUnit.includes('KB')) return value / 1024 / 1024
        return value
    }

    normalizeItem(item: RawPhoneData): UsageItem {
        const value = item.unit === '万元' ? Number(item.number || 0) * 10000 : Number(item.number || 0)
        const unit = item.unit === '万元' ? '元' : item.unit || ''
        const type = item.type
        return {
            type,
            title: (item.remainTitle || typeTitle[type] || type).replace(/通用/g, ''),
            value,
            displayValue: this.formatValue(value),
            unit,
            percent: this.getPercent(item, value),
            icon: typeIcon[type] || 'circle.fill',
            color: typeColor[type] || '#999999',
        }
    }

    formatValue(value: number) {
        if (!Number.isFinite(value)) return '0'
        const fixed = Number(value.toFixed(2))
        return Number.isInteger(fixed) ? `${fixed}` : `${fixed}`
    }

    async getData() {
        this.isRequestSuccess = false
        this.errorMessage = ''
        this.data = []

        let cookie = this.currentSettings.actionSettings.cookie.val
        if (!cookie) cookie = await this.getProxyCookie()
        if (!cookie) {
            this.errorMessage = '请先在设置中填写 Cookie'
            return
        }

        try {
            const response = await this.requestJSON<ChinaUnicomResponse>(
                'https://m.client.10010.com/mobileserviceimportant/home/queryUserInfoSeven?version=iphone_c@8.0200&desmobiel=&showType=0',
                {cookie},
            )
            if (response.code !== 'Y' || !response.data?.dataList?.length) {
                throw new Error('cookie 错误、失效或联通接口维护')
            }
            this.data = response.data.dataList.map(item => this.normalizeItem(item))
            this.isRequestSuccess = true
            console.log(this.data)
        } catch (error) {
            console.log(error)
            this.errorMessage = '获取联通余量失败\n请检查网络或重新登录'
        }
    }

    getItem(type: PhoneDataType) {
        return this.data.find(item => item.type === type)
    }

    getManualItem(type: PhoneDataType) {
        const item = this.getItem(type)
        const color = typeColor[type] || '#999999'
        return {
            type,
            percent: item?.percent || 0,
            title: item?.title || typeTitle[type] || type,
            number: item?.displayValue || '0',
            unit: item?.unit || '',
            en: item?.unit || '',
            icon: typeIcon[type] || 'circle.fill',
            iconColor: new Color(color),
            FGColor: new Color(color),
            BGColor: new Color(color, 0.2),
            colors: [] as string[],
        }
    }

    get fee() {
        return this.getManualItem('fee')
    }

    get flow() {
        return this.getManualItem('flow')
    }

    get voice() {
        return this.getManualItem('voice')
    }

    get point() {
        return this.getManualItem('point')
    }

    async getLogoImage() {
        return await this.$request.get<Image>(this.logo, 'IMG')
    }

    async getSmallLogoImage() {
        return await this.$request.get<Image>(this.smallLogo, 'IMG')
    }

    async header(stack: WidgetStack) {
        const headerStack = stack.addStack()
        headerStack.addSpacer()
        const logo = headerStack.addImage(await this.getLogoImage())
        logo.imageSize = new Size(415 * this.logoScale * this.SCALE, 125 * this.logoScale * this.SCALE)
        headerStack.addSpacer()
        stack.addSpacer()

        const feeStack = stack.addStack()
        feeStack.centerAlignContent()
        feeStack.addSpacer()
        const feeValue = feeStack.addText(`${this.fee.number}`)
        this.unit(feeStack, '元', 5 * this.SCALE, this.widgetColor)
        feeValue.font = Font.boldSystemFont(this.feeTextSize * this.SCALE)
        feeValue.textColor = this.widgetColor
        feeStack.addSpacer()
        stack.addSpacer()
    }

    textLayout(stack: WidgetStack, data: ReturnType<ChinaUnicom['getManualItem']>) {
        const rowStack = stack.addStack()
        rowStack.centerAlignContent()
        const icon = SFSymbol.named(data.icon) || SFSymbol.named('phone.fill')
        icon.applyHeavyWeight()
        const iconElement = rowStack.addImage(icon.image)
        iconElement.imageSize = new Size(this.textSize, this.textSize)
        iconElement.tintColor = data.iconColor
        rowStack.addSpacer(4 * this.SCALE)
        const title = rowStack.addText(data.title)
        rowStack.addSpacer()
        const number = rowStack.addText(data.number + data.unit)
        ;[title, number].forEach(t => {
            t.textColor = this.widgetColor
            t.font = Font.systemFont(this.textSize * this.SCALE)
        })
    }

    async setThirdWidget(widget: WidgetStack) {
        const amountStack = widget.addStack()
        amountStack.centerAlignContent()
        const iconImage = amountStack.addImage(await this.getSmallLogoImage())
        iconImage.imageSize = new Size(24 * this.SCALE, 24 * this.SCALE)
        amountStack.addSpacer()
        const amountText = amountStack.addText(`${this.fee.number}`)
        amountText.font = Font.boldSystemFont(24 * this.SCALE)
        amountText.minimumScaleFactor = 0.5
        amountText.textColor = this.widgetColor
        this.unit(amountStack, '元', 7 * this.SCALE)
        widget.addSpacer()
        const mainStack = widget.addStack()
        this.setRow(mainStack, this.flow, this.flowColorHex)
        mainStack.addSpacer()
        this.setRow(mainStack, this.voice, this.voiceColorHex)
    }

    async setForthWidget(widget: WidgetStack) {
        const bodyStack = widget.addStack()
        bodyStack.cornerRadius = 14 * this.SCALE
        bodyStack.layoutVertically()
        const headerStack = bodyStack.addStack()
        headerStack.setPadding(8 * this.SCALE, 12 * this.SCALE, 0, 12 * this.SCALE)
        headerStack.layoutVertically()
        const title = headerStack.addText(this.fee.title)
        title.font = Font.systemFont(12 * this.SCALE)
        title.textColor = this.widgetColor
        title.textOpacity = 0.7
        const balanceStack = headerStack.addStack()
        const balanceText = balanceStack.addText(`${this.fee.number}`)
        balanceText.minimumScaleFactor = 0.5
        balanceText.font = Font.boldSystemFont(22 * this.SCALE)
        balanceText.textColor = this.widgetColor
        this.unit(balanceStack, '元', 5 * this.SCALE, this.widgetColor)
        balanceStack.addSpacer()
        balanceStack.centerAlignContent()
        const iconImage = balanceStack.addImage(await this.getSmallLogoImage())
        iconImage.imageSize = new Size(24 * this.SCALE, 24 * this.SCALE)
        bodyStack.addSpacer()
        const mainStack = bodyStack.addStack()
        mainStack.setPadding(8 * this.SCALE, 12 * this.SCALE, 8 * this.SCALE, 12 * this.SCALE)
        mainStack.cornerRadius = 14 * this.SCALE
        mainStack.backgroundColor = Color.dynamic(new Color('#E2E2E7', 0.3), new Color('#2C2C2F', 1))
        mainStack.layoutVertically()
        this.setList(mainStack, this.flow)
        mainStack.addSpacer()
        this.setList(mainStack, this.voice)
    }

    setList(stack: WidgetStack, data: ReturnType<ChinaUnicom['getManualItem']>) {
        const rowStack = stack.addStack()
        rowStack.centerAlignContent()
        const lineStack = rowStack.addStack()
        lineStack.size = new Size(8 * this.SCALE, 30 * this.SCALE)
        lineStack.cornerRadius = 4 * this.SCALE
        lineStack.backgroundColor = data.iconColor
        rowStack.addSpacer(10 * this.SCALE)
        const leftStack = rowStack.addStack()
        leftStack.layoutVertically()
        leftStack.addSpacer(2 * this.SCALE)
        const titleStack = leftStack.addStack()
        const title = titleStack.addText(data.title)
        title.font = Font.systemFont(10 * this.SCALE)
        title.textColor = this.widgetColor
        title.textOpacity = 0.5
        const valueStack = leftStack.addStack()
        valueStack.centerAlignContent()
        const value = valueStack.addText(`${data.number}`)
        value.font = Font.semiboldSystemFont(16 * this.SCALE)
        value.textColor = this.widgetColor
        valueStack.addSpacer()
        const unitStack = valueStack.addStack()
        unitStack.cornerRadius = 4 * this.SCALE
        unitStack.borderWidth = 1
        unitStack.borderColor = data.iconColor
        unitStack.setPadding(1, 3 * this.SCALE, 1, 3 * this.SCALE)
        unitStack.size = new Size(30 * this.SCALE, 0)
        unitStack.backgroundColor = Color.dynamic(data.iconColor, new Color(data.iconColor.hex, 0.3))
        const unit = unitStack.addText(data.en)
        unit.font = Font.mediumSystemFont(10 * this.SCALE)
        unit.textColor = Color.dynamic(Color.white(), data.iconColor)
    }

    setRow(stack: WidgetStack, data: ReturnType<ChinaUnicom['getManualItem']>, color: string) {
        const stackWidth = 68 * this.SCALE
        const rowStack = stack.addStack()
        rowStack.layoutVertically()
        rowStack.size = new Size(stackWidth, 0)
        const image = this.gaugeChart(data, color)
        const imageStack = rowStack.addStack()
        imageStack.layoutVertically()
        imageStack.size = new Size(stackWidth, stackWidth)
        imageStack.backgroundImage = image
        imageStack.addSpacer()
        const iconStack = imageStack.addStack()
        iconStack.addSpacer()
        const sfs = SFSymbol.named(data.icon) || SFSymbol.named('phone.fill')
        sfs.applyHeavyWeight()
        const icon = iconStack.addImage(sfs.image)
        icon.imageSize = new Size(22 * this.SCALE, 22 * this.SCALE)
        icon.tintColor = new Color(color)
        iconStack.addSpacer()
        imageStack.addSpacer(8 * this.SCALE)
        const unitStack = imageStack.addStack()
        unitStack.addSpacer()
        const innerStack = unitStack.addStack()
        innerStack.size = new Size(32 * this.SCALE, 0)
        innerStack.setPadding(1, 1, 1, 1)
        innerStack.backgroundColor = new Color(color)
        innerStack.cornerRadius = 4 * this.SCALE
        const unit = innerStack.addText(data.en)
        unit.font = Font.semiboldSystemFont(10 * this.SCALE)
        unit.textColor = Color.white()
        unitStack.addSpacer()
        imageStack.addSpacer(4 * this.SCALE)
        const infoStack = rowStack.addStack()
        infoStack.cornerRadius = 12 * this.SCALE
        infoStack.layoutVertically()
        const gradient = new LinearGradient()
        gradient.colors = [new Color(color, 0.1), new Color(color, 0.01)]
        gradient.locations = [0, 1]
        gradient.startPoint = new Point(0, 0)
        gradient.endPoint = new Point(0, 1)
        infoStack.backgroundGradient = gradient
        const valueStack = infoStack.addStack()
        valueStack.size = new Size(stackWidth, 0)
        valueStack.setPadding(3 * this.SCALE, 0, 2 * this.SCALE, 0)
        const value = valueStack.addText(`${data.number}`)
        value.textColor = this.widgetColor
        value.font = Font.semiboldSystemFont(18 * this.SCALE)
        value.centerAlignText()
        const titleStack = infoStack.addStack()
        titleStack.addSpacer()
        const title = titleStack.addText(data.title)
        title.font = Font.systemFont(9 * this.SCALE)
        title.textOpacity = 0.5
        titleStack.addSpacer()
    }

    async small(stack: WidgetStack, data: ReturnType<ChinaUnicom['getManualItem']>, logo = false, en = false) {
        const bg = new LinearGradient()
        bg.locations = [0, 1]
        bg.endPoint = new Point(1, 0)
        bg.colors = [new Color(data.iconColor.hex, 0.1), new Color(data.iconColor.hex, 0.03)]
        const rowStack = stack.addStack()
        rowStack.centerAlignContent()
        rowStack.setPadding(5, 8, 5, 8)
        rowStack.backgroundGradient = bg
        rowStack.cornerRadius = 12
        const leftStack = rowStack.addStack()
        leftStack.layoutVertically()
        const titleStack = leftStack.addStack()
        const title = titleStack.addText(data.title)
        const balanceStack = leftStack.addStack()
        balanceStack.centerAlignContent()
        const balanceUnit = en ? data.en : ''
        const balance = balanceStack.addText(`${data.number} ${balanceUnit}`)
        if (!en) this.addChineseUnit(balanceStack, data.unit, data.iconColor, 13 * this.SCALE)
        balance.font = Font.semiboldSystemFont(16 * this.SCALE)
        title.textOpacity = 0.5
        title.font = Font.mediumSystemFont(11 * this.SCALE)
        ;[title, balance].forEach(t => (t.textColor = data.iconColor))
        rowStack.addSpacer()
        const iconImage = logo
            ? rowStack.addImage(await this.getSmallLogoImage())
            : rowStack.addImage((SFSymbol.named(data.icon) || SFSymbol.named('phone.fill')).image)
        iconImage.imageSize = new Size(22 * this.SCALE, 22 * this.SCALE)
        iconImage.tintColor = data.iconColor
    }

    async smallCell(stack: WidgetStack, data: ReturnType<ChinaUnicom['getManualItem']>, logo = false, en = false) {
        const bg = new LinearGradient()
        const padding = 6 * this.SCALE
        bg.locations = [0, 1]
        bg.endPoint = new Point(1, 0)
        bg.colors = [new Color(data.iconColor.hex, 0.03), new Color(data.iconColor.hex, 0.1)]
        const rowStack = stack.addStack()
        rowStack.setPadding(4, 4, 4, 4)
        rowStack.backgroundGradient = bg
        rowStack.cornerRadius = 12
        const iconStack = rowStack.addStack()
        iconStack.backgroundColor = data.iconColor
        iconStack.setPadding(padding, padding, padding, padding)
        iconStack.cornerRadius = 17 * this.SCALE
        const iconImage = logo
            ? iconStack.addImage(await this.getSmallLogoImage())
            : iconStack.addImage((SFSymbol.named(data.icon) || SFSymbol.named('phone.fill')).image)
        iconImage.imageSize = new Size(22 * this.SCALE, 22 * this.SCALE)
        iconImage.tintColor = Color.white()
        rowStack.addSpacer(15)
        const rightStack = rowStack.addStack()
        rightStack.layoutVertically()
        const balanceStack = rightStack.addStack()
        balanceStack.centerAlignContent()
        const balanceUnit = en ? data.en : ''
        const balance = balanceStack.addText(`${data.number} ${balanceUnit}`)
        if (!en) this.addChineseUnit(balanceStack, data.unit, data.iconColor, 13 * this.SCALE)
        balance.font = Font.semiboldSystemFont(16 * this.SCALE)
        const titleStack = rightStack.addStack()
        const title = titleStack.addText(data.title)
        title.centerAlignText()
        rowStack.addSpacer()
        title.textOpacity = 0.5
        title.font = Font.mediumSystemFont(11 * this.SCALE)
        ;[title, balance].forEach(t => (t.textColor = data.iconColor))
    }

    async mediumCell(
        canvas: DrawContext,
        stack: WidgetStack,
        data: ReturnType<ChinaUnicom['getManualItem']>,
        color: string,
        fee = false,
        percent = false,
    ) {
        const bg = new LinearGradient()
        bg.locations = [0, 1]
        bg.colors = [new Color(color, 0.03), new Color(color, 0.1)]
        const dataStack = stack.addStack()
        dataStack.backgroundGradient = bg
        dataStack.cornerRadius = 15
        dataStack.layoutVertically()
        dataStack.addSpacer()
        const topStack = dataStack.addStack()
        topStack.addSpacer()
        await this.imageCell(canvas, topStack, data, fee, percent)
        topStack.addSpacer()
        if (fee && this.currentSettings.actionSettings.showUpdateTime.val === '显示') {
            dataStack.addSpacer(5)
            const updateStack = dataStack.addStack()
            updateStack.addSpacer()
            updateStack.centerAlignContent()
            const updateIcon = SFSymbol.named('arrow.2.circlepath')
            updateIcon.applyHeavyWeight()
            const updateImg = updateStack.addImage(updateIcon.image)
            updateImg.tintColor = new Color(color, 0.6)
            updateImg.imageSize = new Size(10, 10)
            updateStack.addSpacer(3)
            const updateText = updateStack.addText(Utils.time('HH:mm'))
            updateText.font = Font.mediumSystemFont(10)
            updateText.textColor = new Color(color, 0.6)
            updateStack.addSpacer()
        }
        dataStack.addSpacer()
        const numberStack = dataStack.addStack()
        numberStack.addSpacer()
        const number = numberStack.addText(`${data.number} ${data.en}`)
        number.font = Font.semiboldSystemFont(15)
        numberStack.addSpacer()
        dataStack.addSpacer(3)
        const titleStack = dataStack.addStack()
        titleStack.addSpacer()
        const title = titleStack.addText(data.title)
        title.font = Font.mediumSystemFont(11)
        title.textOpacity = 0.7
        titleStack.addSpacer()
        dataStack.addSpacer(15)
        ;[title, number].forEach(t => (t.textColor = new Color(color)))
    }

    async imageCell(
        canvas: DrawContext,
        stack: WidgetStack,
        data: ReturnType<ChinaUnicom['getManualItem']>,
        fee: boolean,
        percent = false,
    ) {
        const canvaStack = stack.addStack()
        canvaStack.layoutVertically()
        if (!fee) {
            this.drawArc(canvas, data.percent * 3.6, data.FGColor, data.BGColor)
            canvaStack.size = new Size(this.ringStackSize, this.ringStackSize)
            canvaStack.backgroundImage = canvas.getImage()
            this.ringContent(canvaStack, data, percent)
        } else {
            canvaStack.addSpacer(10)
            const logoStack = canvaStack.addStack()
            logoStack.size = new Size(40, 40)
            logoStack.backgroundImage = await this.getSmallLogoImage()
        }
    }

    ringContent(stack: WidgetStack, data: ReturnType<ChinaUnicom['getManualItem']>, percent = false) {
        const rowIcon = stack.addStack()
        rowIcon.addSpacer()
        const icon = SFSymbol.named(data.icon) || SFSymbol.named('phone.fill')
        icon.applyHeavyWeight()
        const iconElement = rowIcon.addImage(icon.image)
        iconElement.tintColor = data.FGColor
        iconElement.imageSize = new Size(12, 12)
        iconElement.imageOpacity = 0.7
        rowIcon.addSpacer()
        stack.addSpacer(1)
        const rowNumber = stack.addStack()
        rowNumber.addSpacer()
        const number = rowNumber.addText(percent ? `${data.percent}` : `${data.number}`)
        number.font = percent ? Font.systemFont(this.ringTextSize - 2) : Font.mediumSystemFont(this.ringTextSize)
        rowNumber.addSpacer()
        const rowUnit = stack.addStack()
        rowUnit.addSpacer()
        const unit = rowUnit.addText(percent ? '%' : data.unit)
        unit.font = Font.boldSystemFont(8)
        unit.textOpacity = 0.5
        rowUnit.addSpacer()
        ;[unit, number].forEach(t => (t.textColor = percent ? data.FGColor : this.widgetColor))
    }

    makeCanvas(w = this.canvSize, h = this.canvSize) {
        const canvas = new DrawContext()
        canvas.opaque = false
        canvas.respectScreenScale = true
        canvas.size = new Size(w, h)
        return canvas
    }

    sinDeg(deg: number) {
        return Math.sin((deg * Math.PI) / 180)
    }

    cosDeg(deg: number) {
        return Math.cos((deg * Math.PI) / 180)
    }

    drawArc(canvas: DrawContext, deg: number, fillColor: Color, strokeColor: Color) {
        const ctr = new Point(this.canvSize / 2, this.canvSize / 2)
        const bgx = ctr.x - this.canvRadius
        const bgy = ctr.y - this.canvRadius
        const bgd = 2 * this.canvRadius
        const bgr = new Rect(bgx, bgy, bgd, bgd)
        canvas.setStrokeColor(strokeColor)
        canvas.setLineWidth(this.canvWidth)
        canvas.strokeEllipse(bgr)
        for (let t = 0; t < deg; t++) {
            const rectX = ctr.x + this.canvRadius * this.sinDeg(t) - this.canvWidth / 2
            const rectY = ctr.y - this.canvRadius * this.cosDeg(t) - this.canvWidth / 2
            const rect = new Rect(rectX, rectY, this.canvWidth, this.canvWidth)
            canvas.setFillColor(fillColor)
            canvas.setStrokeColor(strokeColor)
            canvas.fillEllipse(rect)
        }
    }

    gaugeChart(data: ReturnType<ChinaUnicom['getManualItem']>, color: string) {
        const drawing = this.makeCanvas()
        const center = new Point(this.canvSize / 2, this.canvSize / 2)
        const radius = this.canvSize / 2 - 10
        const circleRadius = 8
        const startBgAngle = (10 * Math.PI) / 12
        const endBgAngle = (26 * Math.PI) / 12
        const totalBgAngle = endBgAngle - startBgAngle
        const fillColor = data.BGColor
        const lineWidth = circleRadius * 2
        const progress = data.percent / 100
        this.drawLineArc(drawing, center, radius, startBgAngle, endBgAngle, fillColor, lineWidth)
        this.drawHalfCircle(center.x + radius * Math.cos(startBgAngle), center.y + radius * Math.sin(startBgAngle), startBgAngle, circleRadius, drawing, fillColor, -1)
        this.drawHalfCircle(center.x + radius * Math.cos(endBgAngle), center.y + radius * Math.sin(endBgAngle), endBgAngle, circleRadius, drawing, fillColor, 1)
        const fgColor = new Color(color)
        for (let i = 0; i < 240 * progress; i++) {
            const t = i / 240
            const angle = startBgAngle + totalBgAngle * t
            const x = center.x + radius * Math.cos(angle)
            const y = center.y + radius * Math.sin(angle)
            drawing.setFillColor(fgColor)
            drawing.fillEllipse(new Rect(x - circleRadius, y - circleRadius, circleRadius * 2, circleRadius * 2))
        }
        return drawing.getImage()
    }

    drawHalfCircle(centerX: number, centerY: number, startAngle: number, circleRadius: number, context: DrawContext, fillColor: Color, direction = 1) {
        const halfCirclePath = new Path()
        halfCirclePath.move(new Point(centerX + circleRadius * Math.cos(startAngle), centerY + circleRadius * Math.sin(startAngle)))
        for (let i = 0; i <= 10; i++) {
            const t = i / 10
            const angle = startAngle + direction * Math.PI * t
            halfCirclePath.addLine(new Point(centerX + circleRadius * Math.cos(angle), centerY + circleRadius * Math.sin(angle)))
        }
        context.setFillColor(fillColor)
        context.addPath(halfCirclePath)
        context.fillPath()
    }

    drawLineArc(context: DrawContext, center: Point, radius: number, startAngle: number, endAngle: number, fillColor: Color, lineWidth: number) {
        const path = new Path()
        path.move(new Point(center.x + radius * Math.cos(startAngle), center.y + radius * Math.sin(startAngle)))
        for (let i = 1; i <= 100; i++) {
            const t = i / 100
            const angle = startAngle + (endAngle - startAngle) * t
            path.addLine(new Point(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle)))
        }
        context.setStrokeColor(fillColor)
        context.setLineWidth(lineWidth)
        context.addPath(path)
        context.strokePath()
    }

    addChineseUnit(stack: WidgetStack, text: string, color: Color, size: number) {
        const textElement = stack.addText(text)
        textElement.textColor = color
        textElement.font = Font.semiboldSystemFont(size)
        return textElement
    }

    unit(stack: WidgetStack, text: string, spacer: number, color = this.widgetColor) {
        stack.addSpacer(1)
        const unitStack = stack.addStack()
        unitStack.layoutVertically()
        unitStack.addSpacer(spacer)
        const unitTitle = unitStack.addText(text)
        unitTitle.font = Font.semiboldSystemFont(10)
        unitTitle.textColor = color
    }

    renderError(widget: ListWidget) {
        widget.setPadding(16, 16, 16, 16)
        const body = widget.addStack()
        body.layoutVertically()
        body.addSpacer()
        const title = body.addText('中国联通')
        title.font = Font.boldSystemFont(15)
        title.textColor = this.widgetColor
        body.addSpacer(8)
        const message = body.addText(this.errorMessage || '暂无数据')
        message.font = Font.systemFont(12)
        message.textColor = this.widgetColor
        message.textOpacity = 0.68
        body.addSpacer()
    }

    nextRefreshDate() {
        const minutes = Number(this.currentSettings.actionSettings.refreshMinutes.val) || 10
        return new Date(Date.now() + Math.max(1, minutes) * 60 * 1000)
    }

    renderSmall = async (widget: ListWidget) => {
        widget.setPadding(this.smallPadding, this.smallPadding, this.smallPadding, this.smallPadding)
        const bodyStack = widget.addStack()
        bodyStack.layoutVertically()
        if (this.widgetStyle === '1') {
            await this.small(bodyStack, this.fee, true)
            bodyStack.addSpacer()
            await this.small(bodyStack, this.flow, false, true)
            bodyStack.addSpacer()
            await this.small(bodyStack, this.voice)
        } else if (this.widgetStyle === '2') {
            await this.smallCell(bodyStack, this.fee, true)
            bodyStack.addSpacer()
            await this.smallCell(bodyStack, this.flow, false, true)
            bodyStack.addSpacer()
            await this.smallCell(bodyStack, this.voice)
        } else if (this.widgetStyle === '3') {
            await this.setThirdWidget(bodyStack)
        } else if (this.widgetStyle === '4') {
            await this.setForthWidget(bodyStack)
        } else if (this.widgetStyle === '5') {
            await this.header(bodyStack)
            const canvas = this.makeCanvas()
            const ringStack = bodyStack.addStack()
            await this.imageCell(canvas, ringStack, this.flow, false)
            ringStack.addSpacer()
            await this.imageCell(canvas, ringStack, this.voice, false)
        } else {
            await this.header(bodyStack)
            this.textLayout(bodyStack, this.flow)
            bodyStack.addSpacer(7)
            this.textLayout(bodyStack, this.voice)
            bodyStack.addSpacer(7)
            this.textLayout(bodyStack, this.point)
        }
        return widget
    }

    renderMedium = async (widget: ListWidget) => {
        widget.setPadding(this.padding, this.padding, this.padding, this.padding)
        const bodyStack = widget.addStack()
        if (this.widgetStyle === '5') {
            const items = [this.fee, this.flow, this.voice, this.point]
            for (const [index, item] of items.entries()) {
                if (index > 0) bodyStack.addSpacer(6)
                await this.mediumCell(this.makeCanvas(), bodyStack, item, item.iconColor.hex, item.type === 'fee', item.type !== 'fee')
            }
            return widget
        }

        await this.mediumCell(this.makeCanvas(), bodyStack, this.fee, 'd7000f', true)
        bodyStack.addSpacer(this.padding)
        await this.mediumCell(this.makeCanvas(), bodyStack, this.flow, this.flowColorHex, false, true)
        bodyStack.addSpacer(this.padding)
        await this.mediumCell(this.makeCanvas(), bodyStack, this.voice, this.voiceColorHex, false, true)
        return widget
    }

    renderLarge = async (widget: ListWidget) => {
        widget.setPadding(14, 14, 14, 14)
        const bodyStack = widget.addStack()
        bodyStack.layoutVertically()
        const rows = [
            [this.fee, this.flow],
            [this.voice, this.point],
        ]
        for (const row of rows) {
            const rowStack = bodyStack.addStack()
            for (const [index, item] of row.entries()) {
                if (index > 0) rowStack.addSpacer(10)
                await this.mediumCell(this.makeCanvas(), rowStack, item, item.iconColor.hex, item.type === 'fee')
            }
            bodyStack.addSpacer(10)
        }
        return widget
    }

    async render() {
        const widget = new ListWidget()
        await this.getWidgetBackgroundImage(widget)
        await this.getData()

        if (!this.data.length) {
            this.renderError(widget)
            return widget
        }

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

EndAwait(() => Runing(ChinaUnicom, args.widgetParameter, false))
