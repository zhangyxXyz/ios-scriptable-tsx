import type {WidgetTextStyleProps} from './wtext'
import type {WidgetChildrenProps} from './wbox'

export type WdateMode = 'time' | 'date' | 'relative' | 'offset' | 'timer'

/** 日期组件，对应 env runtime 的 GenrateView.wdate。 */
export interface WdateProps extends WidgetTextStyleProps, WidgetChildrenProps {
    /** 要显示的日期。未传时 runtime 使用当前时间。 */
    date?: Date

    /** 显示模式。 */
    mode?: WdateMode
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            wdate: WdateProps
        }
    }
}
