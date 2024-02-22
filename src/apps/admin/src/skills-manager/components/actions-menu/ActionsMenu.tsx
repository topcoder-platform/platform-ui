import { FC, MutableRefObject, ReactNode, useRef, useState } from 'react'
import { usePopper } from 'react-popper'
import classNames from 'classnames'

import { Placement, PositioningStrategy } from '@popperjs/core'
import { useClickOutside } from '~/libs/shared'

import styles from './ActionsMenu.module.scss'

export interface ActionsMenuItem {
    label: string
    action: string
}

interface ActionsMenuProps {
    className?: string
    items: ActionsMenuItem[]
    onAction: (action: string) => void
    children?: ReactNode
    placement?: Placement
    strategy?: PositioningStrategy
}

const ActionsMenu: FC<ActionsMenuProps> = props => {
    const [menuIsVisible, setMenuIsVisible] = useState(false)
    const triggerRef = useRef<HTMLDivElement>()
    const popperRef = useRef<any>()

    const popper = usePopper(triggerRef.current, popperRef.current, {
        modifiers: [{ enabled: true, name: 'preventOverflow' }],
        placement: props.placement ?? 'bottom-end',
        strategy: props.strategy ?? 'fixed',
    })

    useClickOutside(
        triggerRef.current as HTMLDivElement,
        () => setMenuIsVisible(false),
        menuIsVisible,
    )

    function toggleMenu(): void {
        setMenuIsVisible(isVisible => !isVisible)

        if (!menuIsVisible && popper.update) {
            setTimeout(popper.update)
        }
    }

    function renderDropdownMenu(): ReactNode {
        return (
            <div
                ref={popperRef}
                style={popper.styles.popper}
                {...popper.attributes.popper}
                tabIndex={-1}
            >
                {menuIsVisible && (
                    <ul className={styles.menu}>
                        {props.items.map(item => (
                            <li
                                className={styles.menuItem}
                                key={item.label}
                                onClick={function handle() { props.onAction(item.action) }}
                            >
                                <span className='body-small'>
                                    {item.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        )
    }

    return (
        <div className={classNames(styles.wrap, props.className)}>
            <div
                className={classNames(styles.trigger, 'actions-menu_trigger')}
                onClick={toggleMenu}
                ref={triggerRef as MutableRefObject<HTMLDivElement>}
                tabIndex={-1}
            >
                {props.children}
            </div>
            {renderDropdownMenu()}
        </div>
    )
}

export default ActionsMenu
