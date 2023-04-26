import { FC, ReactNode, RefObject, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import ReactTooltip from 'react-tooltip'

import styles from './Tooltip.module.scss'

interface TooltipEvent {
  [key: string]: string
}

interface TooltipProps {
    content?: ReactNode
    place?: 'top' | 'right' | 'bottom' | 'left'
    trigger: ReactNode
    triggerOn?: 'click' | 'hover'
}

const Tooltip: FC<TooltipProps> = (props: TooltipProps) => {
    const tooltipId: RefObject<string> = useRef<string>(uuidv4())

    // if we didn't get a tooltip, just return an empty fragment
    if (!props.content) {
        return <></>
    }

    let event: TooltipEvent = {}
    let tooltipProps: TooltipEvent = {}

    // The following attributes are required by react-tooltip
    // when we want to show the tooltip on click rather than hover
    if (props.triggerOn === 'click') {
        tooltipProps = {
            globalEventOff: 'click',
        }
        event = {
            'data-event': 'click focus',
        }
    }

    return (
        <div>
            <div
                className='tooltip-icon'
                data-tip
                data-for={tooltipId.current}
                {...event}
            >
                {props.trigger}
            </div>
            <ReactTooltip
                className={styles.tooltip}
                id={tooltipId.current as string}
                aria-haspopup='true'
                place={props.place ?? 'bottom'}
                effect='solid'
                event=''
                {...tooltipProps}
            >
                {props.content}
            </ReactTooltip>
        </div>
    )
}

export default Tooltip
