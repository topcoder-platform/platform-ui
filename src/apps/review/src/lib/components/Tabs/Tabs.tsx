/**
 * Tabs.
 */
import { FC, ReactNode, useCallback, useRef, useState } from 'react'
import classNames from 'classnames'

import { useClickOutside } from '~/libs/shared/lib/hooks'

import { SelectOption } from '../../models'

import styles from './Tabs.module.scss'

interface Props {
    className?: string
    items: SelectOption[]
    selected: string
    onChange?: (selected: string) => void
    rightContent?: ReactNode
}

export const Tabs: FC<Props> = (props: Props) => {
    const [isOpen, setIsOpen] = useState(false)
    const triggerRef = useRef<HTMLDivElement>(null)
    const trigger = useCallback(() => {
        setIsOpen(!isOpen)
    }, [isOpen])

    useClickOutside(triggerRef.current, () => setIsOpen(false))

    return (
        <div
            className={classNames(
                styles.container,
                props.className,
                isOpen && styles.open,
            )}
            ref={triggerRef}
        >
            <span className={styles.selectedItem} onClick={trigger}>
                {props.selected}
            </span>
            <div className={styles.blockLeft}>
                {props.items.map(item => (
                    <button
                        type='button'
                        onClick={function onClick() {
                            setIsOpen(false)
                            props.onChange?.(item.value)
                        }}
                        key={item.label}
                        className={classNames(styles.blockItem, {
                            [styles.selected]: item.value === props.selected,
                        })}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {props.rightContent}
        </div>
    )
}

export default Tabs
