import {
    Dispatch,
    FC,
    PropsWithChildren,
    SetStateAction,
    useRef,
    useState,
} from 'react'
import { usePopper } from 'react-popper'
import cn from 'classnames'

import { Placement } from '@popperjs/core'
import { Portal } from '~/libs/ui'
import { useClickOutsideMultipleElements } from '~/libs/shared'

import { useOnScroll } from '../../../hooks'

import styles from './DropdownMenu.module.scss'

interface DropdownMenuProps {
    trigger?: ({
        open,
        setOpen,
    }: {
        open: boolean
        setOpen: React.Dispatch<React.SetStateAction<boolean>>
    }) => React.ReactElement
    triggerUI?: React.ReactElement,
    classNames?: { menu?: string; trigger?: string }
    width?: number
    placement?: Placement
    open?: boolean
    setOpen?: Dispatch<SetStateAction<boolean>>
    shouldIgnoreWhenClickMenu?: boolean
}

const DropdownMenu: FC<PropsWithChildren<DropdownMenuProps>> = props => {
    const triggerRef = useRef<HTMLDivElement>(null)
    const popperRef = useRef<HTMLDivElement>(null)
    const [openInternal, setOpenInternal] = useState(false)
    const setOpen = props.setOpen ?? setOpenInternal
    const open = props.open !== undefined ? props.open : openInternal

    const popper = usePopper(triggerRef.current, popperRef.current, {
        modifiers: [
            { enabled: true, name: 'preventOverflow' },
            { enabled: true, name: 'flip' },
        ],
        placement: props.placement || 'bottom-start',
        strategy: 'fixed',
    })

    useClickOutsideMultipleElements(
        [
            ...(triggerRef.current ? [triggerRef.current] : []),
            ...(popperRef.current && props.shouldIgnoreWhenClickMenu ? [popperRef.current] : []),
        ],
        () => {
            setOpen(false)
        },
        undefined,
        {
            capture: true,
        },
    )

    useOnScroll(
        {
            onScroll: () => { setOpen(false) },
            target: triggerRef.current,
        },
    )

    const context = { open, setOpen }

    return (
        <>
            <div
                ref={triggerRef}
                className={cn(styles.triggerWrapper, props.classNames?.trigger, 'DropdownMenu_triggerWrapper')}
            >
                {props.trigger?.(context)}
                {props.triggerUI}
            </div>

            <Portal>
                <div
                    ref={popperRef}
                    style={{
                        ...popper.styles.popper,
                        width: `${props.width || triggerRef.current?.clientWidth}px`,
                        zIndex: 1,
                    }}
                    {...popper.attributes.popper}
                >
                    {open && (
                        <div
                            className={cn(
                                styles.dropdownMenu,
                                props.classNames?.menu,
                            )}
                        >
                            {props.children}
                        </div>
                    )}
                </div>
            </Portal>
        </>
    )
}

export default DropdownMenu
