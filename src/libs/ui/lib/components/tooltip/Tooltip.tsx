import {
    Children,
    cloneElement,
    FC,
    ReactElement,
    ReactNode,
    RefObject,
    useRef,
} from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import type { EventsType } from 'react-tooltip'
import { get } from 'lodash'
import classNames from 'classnames'
import 'react-tooltip/dist/react-tooltip.css'

import styles from './Tooltip.module.scss'

interface TooltipProps {
    className?: string
    content?: ReactNode
    /** Set clickable=true to allows interactions with the tooltip */
    clickable?: boolean
    disableWrap?: boolean
    place?: 'top' | 'right' | 'bottom' | 'left'
    children?: ReactNode
    triggerOn?: 'click' | 'hover' | 'click-hover'
    strategy?: 'absolute' | 'fixed'
}

function wrapComponents(el: ReactNode, disableWrap?: boolean): ReactNode {
    return disableWrap || typeof get(el, 'type') === 'string'
        ? el
        : <div>{el}</div>
}

const Tooltip: FC<TooltipProps> = (props: TooltipProps) => {
    const tooltipId: RefObject<string> = useRef<string>(uuidv4())
    const triggerMode = props.triggerOn ?? 'hover'
    const triggerOnClick: boolean = triggerMode === 'click' || triggerMode === 'click-hover'
    const tooltipEvents: EventsType[] | undefined = triggerMode === 'click'
        ? ['click']
        : triggerMode === 'click-hover'
            ? ['hover', 'click']
            : undefined

    // if we didn't get a tooltip, just return an empty fragment
    if (!props.content) {
        return <></>
    }

    function renderTrigger(): ReactElement[] {
        return Children.toArray(props.children)
            .map(child => cloneElement((wrapComponents(child, props.disableWrap) as ReactElement), {
                'data-tooltip-delay-show': triggerOnClick ? '0' : '300',
                'data-tooltip-id': tooltipId.current as string,
                'data-tooltip-place': props.place ?? 'bottom',
                'data-tooltip-strategy': props.strategy ?? 'absolute',
                key: tooltipId.current as string,
            } as any))
    }

    return (
        <>
            {renderTrigger()}
            <ReactTooltip
                className={classNames(styles.tooltip, props.className)}
                id={tooltipId.current as string}
                aria-haspopup='true'
                openOnClick={triggerOnClick}
                events={tooltipEvents}
                clickable={props.clickable}
                positionStrategy={props.strategy ?? 'absolute'}
            >
                {props.content}
            </ReactTooltip>
        </>
    )
}

export default Tooltip
