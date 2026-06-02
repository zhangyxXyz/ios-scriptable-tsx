import type {WidgetChildrenProps} from './wbox'

/** 占位组件，对应 env runtime 的 GenrateView.wspacer。 */
export interface WspacerProps extends WidgetChildrenProps {
    /** 占位长度；不传时为弹性占位。 */
    length?: number
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            wspacer: WspacerProps
        }
    }
}
