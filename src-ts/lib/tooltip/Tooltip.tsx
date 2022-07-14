import classNames from 'classnames'
import {
    FC,
    MutableRefObject,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    useClickOutside,
    UseHoverElementValue,
    useOnHoverElement,
    useWindowSize,
    WindowSize,
} from '../hooks'
import { Portal } from '../portal'
import { TooltipArrowIcon } from '../svgs'

import styles from './Tooltip.module.scss'

interface TooltipProps {
    className?: string
    content?: string
    positionX?: 'start' | 'middle' | 'end'
    positionY?: 'start' | 'middle' | 'end'
    trigger: ReactNode
    triggerOn?: 'click' | 'hover'
}

interface ClickHandlersValue {
    onClick: (ev: any) => void
}

function useClickHandlers(
    trigger: MutableRefObject<any>,
    toggle: (ev: any) => void,
    enabled = true,
): ClickHandlersValue | Record<string, unknown> {
    useClickOutside(trigger.current, () => toggle(false), enabled)

    return enabled ? {
        onClick: toggle,
    } : {}
}

const Tooltip: FC<TooltipProps> = ({
    className,
    content,
    trigger,
    triggerOn = 'click',
    positionX = 'middle',
    positionY = 'end',
}: TooltipProps) => {
    const portalRef = useRef<any>(undefined)
    const triggerRef = useRef<any>(undefined)
    const tooltipRef = useRef<any>(undefined)
    const [tooltipOpen, setTooltipOpen] = useState<boolean>(false)
    const { width: windowWidth, height: windowHeight }: WindowSize = useWindowSize()

    const toggleOpen: (toggleValue?: boolean) => void = useCallback((toggleValue?: boolean) => {
        setTooltipOpen((currentTooltipOpen) => (typeof toggleValue === 'boolean' ? toggleValue : !currentTooltipOpen))
    }, [])

    const evHandlers: ClickHandlersValue & UseHoverElementValue | Record<string, unknown> = {
        ...useClickHandlers(triggerRef, toggleOpen, triggerOn === 'click'),
        ...useOnHoverElement(triggerRef.current, toggleOpen, triggerOn === 'hover'),
    }

    useEffect(() => {
        if (!tooltipOpen || !portalRef?.current || !tooltipRef?.current) {
            return
        }

        const triggerEl: HTMLElement = triggerRef.current
        const box: DOMRect = triggerEl.getBoundingClientRect()
        const left: number = Math.max(
            box.left,
            windowWidth - (
                box.left + tooltipRef.current.getBoundingClientRect().width
            ),
        )

        Object.assign(portalRef.current.style, {
            height: `${box.width}px`,
            left: `${left}px`,
            top: `${box.top + window.scrollY}px`,
            width: `${box.width + window.scrollX}px`,
        })
    }, [
        tooltipOpen,
        windowWidth,
        windowHeight,
    ])

    // if we didn't get a tooltip, just return an empty fragment
    if (!content) {
        return null
    }

    return (
        <div className={styles.tooltip}>
            <div
                className={classNames('tooltip-icon', styles['tooltip-icon'])}
                ref={triggerRef}
                {...evHandlers}
            >
                {trigger}
            </div>
            {tooltipOpen && (
                <Portal portalRef={portalRef} className={styles['tooltip-portal']}>
                    <div className={classNames(styles['tooltip-open'], `posy-${positionY}`, `posx-${positionX}`, className)} ref={tooltipRef}>
                        <div className={styles['tooltip-arrow']}>
                            <TooltipArrowIcon />
                        </div>
                        <div className={styles['tooltip-content']}>
                            {content}
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    )
}

export default Tooltip
