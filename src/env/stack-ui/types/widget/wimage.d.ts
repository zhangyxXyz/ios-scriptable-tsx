import type {WidgetChildrenProps, WidgetClickHandler} from './wbox'

export interface CustomFontImageSource {
    url: string
    text: string
    size: number
    textColor: Color | string
}

export type WimageSource = string | Image | CustomFontImageSource

/** 图片组件，对应 env runtime 的 GenrateView.wimage。 */
export interface WimageProps extends WidgetChildrenProps {
    /** 图片 URL、base64 data URL、SF Symbol 名称、Image 对象或自定义字体绘制配置。 */
    src: WimageSource

    /** 点击打开的 URL。 */
    href?: string

    /** 是否允许图片自适应缩放。 */
    resizable?: boolean

    /** 宽度。默认 0。 */
    width?: number

    /** 高度。默认 0。 */
    height?: number

    /** 图片透明度，0 到 1。 */
    opacity?: number

    /** 圆角。 */
    borderRadius?: number

    /** 边框宽度。 */
    borderWidth?: number

    /** 边框颜色。 */
    borderColor?: Color | string

    /** 是否按父容器形状裁剪。 */
    containerRelativeShape?: boolean

    /** 图片 tintColor。 */
    filter?: Color | string

    /** 图片水平对齐方式。 */
    imageAlign?: 'left' | 'center' | 'right'

    /** 图片内容模式。 */
    mode?: 'fit' | 'fill'

    /** 点击事件，会通过 Scriptable URL scheme 回调当前脚本。 */
    onClick?: WidgetClickHandler
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            wimage: WimageProps
        }
    }
}
