export type WidgetBackground = Color | Image | LinearGradient | string
export type WidgetClickHandler = () => unknown
export type WidgetPadding = [number, number, number, number]

export interface WidgetChildrenProps {
    children?: unknown
}

/** ListWidget 根容器，对应 env runtime 的 GenrateView.wbox。 */
export interface WboxProps extends WidgetChildrenProps {
    /** 背景色、背景图、渐变或图片地址。 */
    background?: WidgetBackground

    /** 子元素间距。 */
    spacing?: number

    /** 点击打开的 URL。 */
    href?: string

    /** 小组件下次刷新时间。 */
    updateDate?: Date

    /** 内边距：[top, left, bottom, right]。 */
    padding?: WidgetPadding

    /** 点击事件，会通过 Scriptable URL scheme 回调当前脚本。 */
    onClick?: WidgetClickHandler
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            wbox: WboxProps
        }
    }
}
