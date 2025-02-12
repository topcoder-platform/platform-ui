import { FC, PropsWithChildren, useRef, useState } from 'react'
import { usePopper } from 'react-popper'
import cn from 'classnames'

import { Placement } from '@popperjs/core'
import { Portal } from '~/libs/ui'
import { useClickOutside } from '~/libs/shared'

import { useOnScroll } from '../../../hooks'

import styles from './DropdownMenu.module.scss'

interface DropdownMenuProps {
    trigger: ({
        open,
        setOpen,
    }: {
        open: boolean
        setOpen: React.Dispatch<React.SetStateAction<boolean>>
    }) => React.ReactElement
    classNames?: { menu?: string; trigger?: string }
    width?: number
    placement?: Placement
}

const DropdownMenu: FC<PropsWithChildren<DropdownMenuProps>> = props => {
    const triggerRef = useRef<HTMLDivElement>(null)
    const popperRef = useRef(null)
    const [open, setOpen] = useState(false)

    const popper = usePopper(triggerRef.current, popperRef.current, {
        modifiers: [
            { enabled: true, name: 'preventOverflow' },
            { enabled: true, name: 'flip' },
        ],
        placement: props.placement || 'bottom-start',
        strategy: 'fixed',
    })

    useClickOutside(triggerRef.current, () => setOpen(false), undefined, {
        capture: true,
    })

    useOnScroll({ onScroll: () => setOpen(false), target: triggerRef.current })

    const context = { open, setOpen }

    return (
        <>
            <div
                ref={triggerRef}
                className={cn(styles.triggerWrapper, props.classNames?.trigger)}
            >
                {props.trigger(context)}
            </div>

            <Portal>
                <div
                    ref={popperRef}
                    style={{
                        ...popper.styles.popper,
                        width: `${props.width || triggerRef.current?.clientWidth}px`,
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
