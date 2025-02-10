import { FC, PropsWithChildren, useRef, useState } from 'react'
import { usePopper } from 'react-popper'
import { useClickOutside } from '~/libs/shared'
import { Placement } from '@popperjs/core'
import { Portal } from '~/libs/ui'
import cn from 'classnames'
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

const DropdownMenu: FC<PropsWithChildren<DropdownMenuProps>> = ({
    trigger,
    children,
    classNames,
    width,
    placement,
}) => {
    const triggerRef = useRef<HTMLDivElement>(null)
    const popperRef = useRef(null)
    const [open, setOpen] = useState(false)

    const popper = usePopper(triggerRef.current, popperRef.current, {
        placement: placement || 'bottom-start',
        strategy: 'fixed',
        modifiers: [
            { name: 'preventOverflow', enabled: true },
            { name: 'flip', enabled: true },
        ],
    })

    useClickOutside(triggerRef.current, () => setOpen(false), undefined, { capture: true })
    useOnScroll({ target: triggerRef.current, onScroll: () => setOpen(false) })

    const context = { open, setOpen }

    return (
        <>
            <div ref={triggerRef} className={cn(styles.triggerWrapper, classNames?.trigger)}>
                {trigger(context)}
            </div>

            <Portal>
                <div
                    ref={popperRef}
                    style={{ ...popper.styles.popper, width: `${width || triggerRef.current?.clientWidth}px` }}
                    {...popper.attributes.popper}
                >
                    {open && <div className={cn(styles.dropdownMenu, classNames?.menu)}>{children}</div>}
                </div>
            </Portal>
        </>
    )
}

export default DropdownMenu
