export type WidgetFamily = 'small' | 'medium' | 'large'
export type WidgetSizeName = WidgetFamily | 'small' | 'medium' | 'large'

export type SettingValue<T> = {
    val: T
    type: string
}

declare global {
    interface WidgetText {
        size: Size
    }
}

export type SettingItemType =
    | 'text'
    | 'color'
    | 'slider'
    | 'select'
    | 'password'
    | 'image'
    | 'menu'
    | 'switch'
    | 'reset'
    | 'removeBackground'
    | 'customAction'
    | string

export type SettingItemCategory = 'actionSettings' | string

export type SettingSelectOption = {
    label: string
    value: unknown
}

export interface SettingItemConfig {
    /** 显示风格。 */
    style?: 'emphasis' | 'compact' | string

    /** 截断长度。未配置使用默认值，<= 0 不截断。 */
    truncateLength?: number

    /** 空值时显示的默认内容。 */
    defaultShowContent?: string

    /** 是否从 baseSettings 读取原始值，不走 settings[category]。 */
    useRawValue?: boolean

    /** menu 类型选项。 */
    menuOptions?: string[]

    /** slider 最小值。 */
    min?: number

    /** slider 最大值。 */
    max?: number

    /** slider 步长。 */
    step?: number

    /** slider 单位。 */
    unit?: string

    /** select 类型选项。 */
    selectOptions?: SettingSelectOption[]

    /** select 是否多选。 */
    multiple?: boolean

    /** select 是否允许用户自定义增删选项。 */
    editable?: boolean

    /** text/password/image URL 输入占位符。 */
    placeholder?: string

    /** image 来源。 */
    imageSource?: 'album' | 'url' | 'screenshot' | 'both' | string

    /** image 是否显示缩略图。 */
    showThumbnail?: boolean

    /** image 是否可清空。 */
    clearable?: boolean

    /** image 设置成功后是否通知。 */
    notifyOnSet?: boolean

    /** image 已设置状态图标名。 */
    setIcon?: string

    /** image 未设置状态图标名。 */
    emptyIcon?: string

    /** customAction 动作名。 */
    actionName?: string

    /** customAction 动作值。 */
    actionValue?: unknown

    /** 自定义通知文案。 */
    notifyMessages?: {
        success?: string
        clear?: string
        [key: string]: string | undefined
    }

    [key: string]: unknown
}

export interface SettingItem {
    /** 分类。默认 actionSettings；其他值表示独立分类。 */
    category?: SettingItemCategory

    /** 标题。 */
    title: string

    /** 描述。 */
    desc?: string

    /** 图标配置或 URL 字符串。 */
    icon?: string | {name: string; color: string}

    /** 数据类型；reset/removeBackground 为特殊类型，不参与设置保存。 */
    type?: SettingItemType

    /** 数据键值对，如 { lightColor: '#000000' }。 */
    option?: Record<string, unknown>

    /** 类型特定配置。 */
    config?: SettingItemConfig

    /** 自定义点击行为；提供后接管默认 webview 输入界面。返回 true 时由脚本层自行表示动作已处理。 */
    onAction?: (webView: WebView, item: SettingItem) => void | boolean | Promise<void | boolean>

    /** 指定保存到的设置分类，未配置时保存到当前分类。 */
    saveCategory?: string

    /** 唯一标识符，通常由 env 自动生成。 */
    id?: string
}

export interface AppViewOptions {
    widgetProvider?: Partial<Record<WidgetFamily, boolean>>
    settingItems?: SettingItem[]
    onItemClick?: (item: SettingItem) => Promise<void> | void
}

export type WidgetSetting = Record<string, unknown>

export type RequestDataType = 'JSON' | 'STRING' | 'IMG' | 'json' | 'text' | 'image' | 'data'

export interface RequestClient {
    get<T = unknown>(
        url: string | Record<string, unknown>,
        options?: Record<string, unknown> | RequestDataType,
        type?: RequestDataType,
    ): Promise<T>
    post<T = unknown>(
        url: string | Record<string, unknown>,
        options?: Record<string, unknown> | RequestDataType,
        type?: RequestDataType,
    ): Promise<T>
}

export type SettingValueType = 'string' | 'stringecheck' | 'int' | 'float' | 'bool' | 'array'

export type ExtraSettingType = 'text' | 'select' | 'cell' | 'color' | 'password' | string

export type SettingIcon = string | {name: string; color: string}

export interface ExtraSettingOptions {
    selectOptions?: string[]
    multiple?: boolean
    editable?: boolean
    [key: string]: unknown
}

export interface SeiunUtils {
    time(fmt: string, ts?: number | string | Date | null): string
    randomColor16(): string
    isEmpty(value: unknown): boolean
    renderUnsupport(widget?: ListWidget | null): Promise<void>
    char2PinFirstChar(value: string): Promise<string>
    char2PinFullChar(value: string): Promise<string>
    drawTextWithCustomFont(
        fontUrl: string,
        text: string,
        fontSize: number,
        textColor: Color | string,
        align?: 'left' | 'center' | 'right',
        lineLimit?: number,
        rowSpacing?: number,
    ): Promise<Image>
}

export interface SeiunGenrateView {
    setListWidget(listWidget: ListWidget): void
    wbox(props: Record<string, unknown>, ...children: unknown[]): Promise<ListWidget | undefined>
}

export interface WidgetStorage {
    getStorage<T = unknown>(key: string, expirationMinutes?: number, isDelStorageWhenTimeExceed?: boolean): T | null
    setStorage<T = unknown>(key: string, value: T): void
    removeStorage(key: string): void
    getStorageTime(key: string): string | Date | null
    getImage(key: string, returnImage?: boolean, useCache?: boolean, logable?: boolean, cacheKey?: string | null): Promise<Image | string | null>
    removeFile(key: string, useImagesPath?: boolean): boolean
}

export declare class WidgetBase {
    constructor(scriptName?: string)

    name?: string
    en?: string
    noneCategoryName: string
    basicSettingsCategoryName: string
    storageExpirationMinutes: number
    backgroundColor: string
    widgetFamily?: WidgetFamily
    widgetColor: Color
    backGroundColor: Color | LinearGradient
    settings: Record<string, unknown>
    currentSettings: Record<string, Record<string, {val: unknown; type?: string}>>
    settingValTypeString: SettingValueType
    stttingValTypeStringEmptyCheck: SettingValueType
    settingValTypeInt: SettingValueType
    settingValTypeFloat: SettingValueType
    settingValTypeBool: SettingValueType
    settingValTypeArray: SettingValueType
    $request: RequestClient
    storage: WidgetStorage

    init(widgetFamily?: WidgetFamily): void
    render(options?: {widgetSetting: WidgetSetting}): Promise<ListWidget> | ListWidget
    getAppViewOptions?(): Promise<AppViewOptions> | AppViewOptions

    readWidgetSetting(): WidgetSetting
    writeWidgetSetting(setting: WidgetSetting): void
    saveSettings(notify?: boolean): void
    getDateStr(date: Date, format: string): string
    getWidgetSize(size: WidgetSizeName): Size
    dynamicColor(light: string, dark: string): Color
    changeBgMode2OnLineBg(urls: string[]): void
    getImageByUrl(url: string, storage?: WidgetStorage | null, cacheKey?: string | null): Promise<Image | null>
    getWidgetBackgroundImage(widget: ListWidget): Promise<boolean>
    notify(title: string, body: string, url?: string | null, opts?: Record<string, unknown> | null): Promise<void>
    reopenScript(): void
    setWidgetConfig(): Promise<void>
    presentSettings(...args: unknown[]): Promise<void>
    registerSetting(items: SettingItem | SettingItem[]): void
    registerSettingCategory(category: string, title: string, items: SettingItem[]): void
    md5(str: string): string
    getSettings(json?: boolean): Record<string, unknown>
    syncCurrentSettings(category: string, key: string, value: unknown): void
    setAlertInput(
        title: string,
        desc?: string,
        opt?: Record<string, string>,
        category?: string | null,
        isSave?: boolean,
    ): Promise<Record<string, string> | undefined>
    insertTextByElementId(webView: WebView, elementId: string, text: string): Promise<void>
    getSettingElementId(category?: string, optionKey?: string): string
    shadowImage(img: Image, color?: string, opacity?: number): Promise<Image>
}

export type RunnableWidget = new (scriptName?: string) => {
    render(options?: {widgetSetting: WidgetSetting}): Promise<ListWidget> | ListWidget
}

export interface SeiunEnv {
    WidgetBase: typeof WidgetBase
    Runing: (Widget: RunnableWidget, defaultArgs?: string, isDebug?: boolean, extra?: unknown) => Promise<void>
    h: (type: unknown, props?: Record<string, unknown>, ...children: unknown[]) => unknown
    Utils: SeiunUtils
    Cache: unknown
    Storage: unknown
    GenrateView: SeiunGenrateView
}
