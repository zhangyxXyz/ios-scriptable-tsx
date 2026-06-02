import type {WidgetChildrenProps, WidgetClickHandler} from './wbox'

export interface WidgetTextStyleProps {
    /** 文本颜色。 */
    textColor?: Color | string

    /** 字体对象或系统字体大小。 */
    font?: Font | number

    /** 文本透明度，0 到 1。 */
    opacity?: number

    /** 最大行数。 */
    maxLine?: number

    /** 最小缩放比例。 */
    scale?: number

    /** 阴影颜色。 */
    shadowColor?: Color | string

    /** 阴影半径。 */
    shadowRadius?: number

    /** 阴影偏移。 */
    shadowOffset?: Point

    /** 点击打开的 URL。 */
    href?: string

    /** 文本水平对齐方式。 */
    textAlign?: 'left' | 'center' | 'right'

    /** 点击事件，会通过 Scriptable URL scheme 回调当前脚本。 */
    onClick?: WidgetClickHandler
}

/** 文本组件，对应 env runtime 的 GenrateView.wtext。 */
export interface WtextProps extends WidgetTextStyleProps, WidgetChildrenProps {}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            wtext: WtextProps
        }
    }
}
