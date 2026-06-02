import type {WidgetBackground, WidgetChildrenProps, WidgetClickHandler, WidgetPadding} from './wbox'

/** Stack 容器，对应 env runtime 的 GenrateView.wstack。 */
export interface WstackProps extends WidgetChildrenProps {
    /** 背景色、背景图、渐变或图片地址。 */
    background?: WidgetBackground

    /** 与同级上一个元素的间距。 */
    spacing?: number

    /** 内边距：[top, left, bottom, right]。 */
    padding?: WidgetPadding

    /** 宽度。默认 0。 */
    width?: number

    /** 高度。默认 0。 */
    height?: number

    /** 圆角。 */
    borderRadius?: number

    /** 边框宽度。 */
    borderWidth?: number

    /** 边框颜色。 */
    borderColor?: Color | string

    /** 点击打开的 URL。 */
    href?: string

    /** 内容垂直对齐方式。 */
    verticalAlign?: 'top' | 'center' | 'bottom'

    /** 布局方向。 */
    flexDirection?: 'row' | 'column'

    /** 点击事件，会通过 Scriptable URL scheme 回调当前脚本。 */
    onClick?: WidgetClickHandler
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            wstack: WstackProps
        }
    }
}
