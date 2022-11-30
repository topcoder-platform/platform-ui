import { FC, ReactNode, RefObject, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import ReactTooltip from 'react-tooltip'

import styles from './Tooltip.module.scss'

interface TooltipEvent {
  [key: string]: string
}

interface TooltipProps {
    content?: string
    place?: 'top' | 'right' | 'bottom' | 'left'
    trigger: ReactNode
    triggerOn?: 'click' | 'hover'
}

const Tooltip: FC<TooltipProps> = ({
    content,
    trigger,
    triggerOn = 'hover',
    place = 'bottom',
}: TooltipProps) => {
    const tooltipId: RefObject<string> = useRef<string>(uuidv4())

    // if we didn't get a tooltip, just return an empty fragment
    if (!content) {
        return <></>
    }

    let event: TooltipEvent = {}
    let tooltipProps: TooltipEvent = {}
    // The following attributes are required by react-tooltip when we want to show the tooltip on click rather than hover
    if (triggerOn === 'click') {
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
                {trigger}
            </div>
            <ReactTooltip
                className={styles.tooltip}
                id={tooltipId.current}
                aria-haspopup='true'
                place={place}
                effect='solid'
                event=''
                {...tooltipProps}
            >
                {content}
            </ReactTooltip>
        </div>
    )
}

export default Tooltip
