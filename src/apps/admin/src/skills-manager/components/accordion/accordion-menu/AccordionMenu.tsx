import { FC, ReactNode, useState } from 'react'

import { IconOutline } from '~/libs/ui'

import styles from './AccordionMenu.module.scss'

export interface AccordionMenuItem {
    label: string
    action: string
}

interface AccordionMenuProps {
    items: AccordionMenuItem[]
    onAction: (action: string) => void
    children?: ReactNode
}

const AccordionMenu: FC<AccordionMenuProps> = props => {
    const [isMenuVisible, setIsMenuVisible] = useState(false)

    function toggleMenu(): void {
        setIsMenuVisible(isVisible => !isVisible)
    }

    function renderDropdownMenu(): ReactNode {
        return (
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
        )
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.trigger} onClick={toggleMenu}>
                {props.children || (
                    <IconOutline.DotsVerticalIcon className='icon-lg' />
                )}
            </div>
            {isMenuVisible && renderDropdownMenu()}
        </div>
    )
}

export default AccordionMenu
