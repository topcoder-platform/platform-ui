/**
 * Button to open dropdown menu.
 */
import { FC, PropsWithChildren, useState } from 'react'
import classNames from 'classnames'

import DropdownMenu from '../DropdownMenu/DropdownMenu'

import styles from './DropdownMenuButton.module.scss'

interface Props {
    className?: string
    options?: string[]
    onSelectOption?: (item: string) => void
}

export const DropdownMenuButton: FC<PropsWithChildren<Props>> = (
    props: PropsWithChildren<Props>,
) => {
    const [openDropdown, setOpenDropdown] = useState(false)

    return (
        <DropdownMenu
            open={openDropdown}
            width={160}
            setOpen={setOpenDropdown}
            placement='bottom-end'
            shouldIgnoreWhenClickMenu
            triggerUI={(
                <div
                    className={classNames(styles.container, props.className)}
                    onClick={function onClick() { setOpenDropdown(!openDropdown) }}
                >
                    {props.children}
                </div>
            )}
        >
            <ul>
                {(props.options || []).map(item => (
                    <li key={item}>
                        <button
                            type='button'
                            className={styles.btnMenuItem}
                            onClick={function onClick() {
                                setOpenDropdown(false)
                                props.onSelectOption?.(item)
                            }}
                        >
                            {item}
                        </button>
                    </li>
                ))}
            </ul>
        </DropdownMenu>
    )
}

export default DropdownMenuButton
