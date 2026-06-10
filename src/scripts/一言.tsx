// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: feather-alt;

/*
 * author   :  seiun
 * date     :  2021/10/21
 * desc     :  一言语录轮播，支持自定义 API 地址与句子类型过滤
 * version  :  1.0.0
 * github   :  https://github.com/zhangyxXyz/ios-scriptable-tsx
 * changelog:
 */

import type {SeiunEnv} from '@app/env/types'

declare const importModule: (moduleName: string) => SeiunEnv

type SettingValue<T> = {
    val: T
    type: string
}

type OneWordSettings = {
    basicSettings: {
        apiUrl: SettingValue<string>
        filterTypes: SettingValue<string[]>
    }
    displaySettings: {
        listDataColorShowType: SettingValue<string>
    }
}

type HitokotoResponse = {
    id?: number
    uuid?: string
    hitokoto?: string
    type?: string
    from?: string
    from_who?: string | null
    creator?: string
    creator_uid?: number
    reviewer?: number
    commit_from?: string
    created_at?: string | number
    length?: number
}

const dependencyFileName = 'Seiun.Env.js'
const runtimeRequire = typeof require === 'undefined' ? importModule : require
const {WidgetBase, Runing, Utils, GenrateView, h} = runtimeRequire(dependencyFileName) as SeiunEnv

const hitokotoTypes = [
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
] as const

class OneWord extends WidgetBase {
    widgetParam = args.widgetParameter
    splitWidgetParam: string[] = []
    httpData: HitokotoResponse | null = null
    isRequestSuccess = false

    currentSettings: OneWordSettings = {
        basicSettings: {
            apiUrl: {val: 'https://v1.hitokoto.cn', type: this.settingValTypeString},
            filterTypes: {val: [], type: this.settingValTypeArray},
        },
        displaySettings: {
            listDataColorShowType: {val: '随机颜色', type: this.settingValTypeString},
        },
    }

    constructor(scriptName?: string) {
        super(scriptName)
        this.name = '一言'
        this.en = 'One Word'
        this.storageExpirationMinutes = 1
        this.Run()
    }

    init = async () => {
        try {
            await this.getData()
        } catch (error) {
            console.log(error)
        }
    }

    async getData() {
        const cachedWord = this.storage.getStorage<HitokotoResponse>('word', 1)
        if (cachedWord) {
            console.log('[+] 请求间隔时间过小，使用缓存数据')
            this.httpData = cachedWord
            return
        }

        this.isRequestSuccess = false
        try {
            let filterTypes = this.currentSettings.basicSettings.filterTypes.val || []
            if (this.splitWidgetParam.length >= 2) {
                filterTypes = this.splitWidgetParam[1].split('')
            }

            const apiUrl = (this.currentSettings.basicSettings.apiUrl.val || 'https://v1.hitokoto.cn').replace(/\/$/, '')
            const types = filterTypes.map(type => `c=${encodeURIComponent(type)}`).join('&')
            const url = `${apiUrl}${Utils.isEmpty(types) ? '' : `?${types}`}`
            const data = await this.$request.get<HitokotoResponse>(url)
            console.log(`[+] 数据请求成功：${url}`)
            this.storage.setStorage('word', data)
            this.httpData = data
            this.isRequestSuccess = true
        } catch (error) {
            console.log(`[+] getData 出错，尝试使用缓存数据：${error}`)
            this.httpData = this.storage.getStorage<HitokotoResponse>('word')
        }

        console.log(this.httpData)
    }

    Run() {
        try {
            if (this.widgetParam) {
                this.splitWidgetParam = this.widgetParam.split(',')
            }
        } catch (error) {
            console.log(error)
        }

        if (!config.runsInApp) return

        this.registerSettingCategory('basicSettings', '基础设置', [
            {
                title: 'API',
                desc: '设置一言 API 地址',
                icon: {name: 'link', color: '#1890ff'},
                type: 'text',
                option: {apiUrl: 'https://v1.hitokoto.cn'},
                config: {
                    placeholder: 'https://v1.hitokoto.cn',
                    style: 'compact',
                    truncateLength: -1,
                },
            },
            {
                title: '分类',
                desc: '选择一言分类，可多选\n缺省值：全分类',
                icon: {name: 'list.bullet.rectangle', color: '#722ed1'},
                type: 'select',
                option: {filterTypes: []},
                config: {
                    selectOptions: [...hitokotoTypes],
                    defaultShowContent: '全分类',
                    multiple: true,
                    editable: true,
                },
            },
        ])

        this.registerSettingCategory('displaySettings', '显示设置', [
            {
                title: '数据条目颜色',
                desc: '缺省值：随机颜色',
                icon: 'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Settings/colorSet.png',
                type: 'select',
                option: {listDataColorShowType: '随机颜色'},
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
            },
        })
    }

    getFromText(data: HitokotoResponse) {
        const fromWho = data.from_who || ''
        const from = data.from || ''

        if (!Utils.isEmpty(fromWho) || !Utils.isEmpty(from)) {
            const parts: string[] = []
            if (this.widgetFamily === 'medium' && fromWho) parts.push(fromWho)
            if (from) parts.push(`《${from}》`)
            return parts.join(' ')
        }

        return '佚名'
    }

    shouldUseRandomTextColor() {
        if (this.splitWidgetParam.length >= 1) {
            return parseInt(this.splitWidgetParam[0]) === 1
        }
        return this.currentSettings.displaySettings.listDataColorShowType.val === '随机颜色'
    }

    getContentTextStyle() {
        switch (String(this.widgetFamily)) {
            case 'small':
                return {font: Font.lightSystemFont(15), maxLine: 5}
            case 'large':
                return {font: Font.lightSystemFont(18), maxLine: 10}
            case 'medium':
            default:
                return {font: Font.lightSystemFont(17), maxLine: 4}
        }
    }

    async renderCommon(widget: ListWidget) {
        GenrateView.setListWidget(widget)

        const hitokoto = this.httpData?.hitokoto || '人生这辈子不就是笑笑别人和被别人笑笑嘛~'
        const from = this.httpData ? this.getFromText(this.httpData) : '一言'
        const oneWordIcon =
            (await this.getImageByUrl(
                'https://raw.githubusercontent.com/zhangyxXyz/PicGallery/master/IconSet/Scriptable/Application/OneWord.png',
            )) || SFSymbol.named('quote.bubble').image
        const contentTextStyle = this.getContentTextStyle()

        return (
            <wbox background={this.backGroundColor}>
                <wstack verticalAlign="center">
                    <wimage src={oneWordIcon} width={14} height={14} borderRadius={4} />
                    <wspacer length={10} />
                    <wtext opacity={0.7} font={Font.boldSystemFont(12)} textColor={this.widgetColor}>
                        一言
                    </wtext>
                </wstack>
                <wspacer />
                <wtext
                    font={contentTextStyle.font}
                    maxLine={contentTextStyle.maxLine}
                    scale={0.75}
                    textColor={this.shouldUseRandomTextColor() ? new Color(Utils.randomColor16()) : this.widgetColor}
                >
                    {hitokoto}
                </wtext>
                <wspacer />
                <wtext font={Font.lightSystemFont(12)} textColor={this.widgetColor} opacity={0.5} textAlign="right" maxLine={1}>
                    {from}
                </wtext>
            </wbox>
        )
    }

    renderSmall = async (widget: ListWidget) => {
        return await this.renderCommon(widget)
    }

    renderMedium = async (widget: ListWidget) => {
        return await this.renderCommon(widget)
    }

    renderLarge = async (widget: ListWidget) => {
        return await this.renderCommon(widget)
    }

    renderAccessoryInline = async (widget: ListWidget) => {
        widget.addText(this.httpData?.hitokoto || '人生这辈子不就是笑笑别人和被别人笑笑嘛~')
        return widget
    }

    async render() {
        const widget = new ListWidget()
        await this.getWidgetBackgroundImage(widget)
        await this.init()

        switch (String(this.widgetFamily)) {
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

EndAwait(() => Runing(OneWord, args.widgetParameter, false))
