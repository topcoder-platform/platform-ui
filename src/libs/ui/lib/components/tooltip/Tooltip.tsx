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
    disableWrap?: boolean
    place?: 'top' | 'right' | 'bottom' | 'left'
    children?: ReactNode
    /** Use click-hover to support mouse hover, keyboard focus, and click/touch toggling. */
    triggerOn?: 'click' | 'hover' | 'click-hover'
    strategy?: 'absolute' | 'fixed'
    disableTooltip?: boolean
}

function wrapComponents(el: ReactNode, disableWrap?: boolean): ReactNode {
    return disableWrap || typeof get(el, 'type') === 'string'
        ? el
        : <div>{el}</div>
}

/**
 * Renders shared tooltip content around one or more trigger elements.
 *
 * Use click-hover mode when a tooltip must support pointer hover, keyboard focus,
 * and click or touch toggling. This component does not throw.
 *
 * @param {TooltipProps} props - Tooltip content, triggers, placement, and interaction mode.
 * @returns {JSX.Element} Cloned triggers plus the configured react-tooltip overlay.
 */
const Tooltip: FC<TooltipProps> = (props: TooltipProps) => {
    const tooltipId: RefObject<string> = useRef<string>(uuidv4())
    const triggerMode = props.triggerOn ?? 'hover'
    const triggerOnClick: boolean = triggerMode === 'click'
    const triggerOnClickHover: boolean = triggerMode === 'click-hover'
    const triggerIncludesClick: boolean = triggerOnClick || triggerOnClickHover

    // if we didn't get a tooltip, just return an empty fragment
    if (!props.content) {
        return <></>
    }

    function renderTrigger(): ReactElement[] {
        return Children.toArray(props.children)
            .map((child, i) => cloneElement((wrapComponents(child, props.disableWrap) as ReactElement), {
                'data-tooltip-delay-show': triggerIncludesClick ? '0' : '300',
                'data-tooltip-id': tooltipId.current as string,
                'data-tooltip-place': props.place ?? 'bottom',
                'data-tooltip-strategy': props.strategy ?? 'absolute',
                key: `${tooltipId.current as string}-${i}`,
            } as any))
    }

    return (
        <>
            {renderTrigger()}
            {!props.disableTooltip && (
                <ReactTooltip
                    className={classNames(styles.tooltip, props.className)}
                    id={tooltipId.current as string}
                    aria-haspopup='true'
                    openOnClick={triggerOnClick}
                    openEvents={triggerOnClickHover ? {
                        click: true,
                        focus: true,
                        mouseover: true,
                    } : undefined}
                    closeEvents={triggerOnClickHover ? {
                        blur: true,
                        click: true,
                        mouseout: true,
                    } : undefined}
                    clickable={props.clickable}
                    positionStrategy={props.strategy ?? 'absolute'}
                >
                    {props.content}
                </ReactTooltip>
            )}
        </>
    )
}

export default Tooltip
