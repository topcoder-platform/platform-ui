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
import { get } from 'lodash'
import classNames from 'classnames'
import 'react-tooltip/dist/react-tooltip.css'

import styles from './Tooltip.module.scss'

interface TooltipProps {
    className?: string
    content?: ReactNode
    /** Set clickable=true to allows interactions with the tooltip */
    clickable?: boolean
    place?: 'top' | 'right' | 'bottom' | 'left'
    children?: ReactNode
    triggerOn?: 'click' | 'hover'
}

function wrapComponents(el: ReactNode): ReactNode {
    return typeof get(el, 'type') === 'string'
        ? el
        : <div>{el}</div>
}

const Tooltip: FC<TooltipProps> = (props: TooltipProps) => {
    const tooltipId: RefObject<string> = useRef<string>(uuidv4())

    // if we didn't get a tooltip, just return an empty fragment
    if (!props.content) {
        return <></>
    }

    function renderTrigger(): ReactElement[] {
        return Children.toArray(props.children)
            .map(child => cloneElement((wrapComponents(child) as ReactElement), {
                'data-tooltip-delay-show': '300',
                'data-tooltip-id': tooltipId.current as string,
                'data-tooltip-place': props.place ?? 'bottom',
            } as any))
    }

    return (
        <>
            {renderTrigger()}
            <ReactTooltip
                className={classNames(styles.tooltip, props.className)}
                id={tooltipId.current as string}
                aria-haspopup='true'
                openOnClick={props.triggerOn === 'click'}
                clickable={props.clickable}
            >
                {props.content}
            </ReactTooltip>
        </>
    )
}

export default Tooltip
