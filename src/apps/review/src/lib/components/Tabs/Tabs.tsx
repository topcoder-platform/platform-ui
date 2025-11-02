/* eslint-disable ordered-imports/ordered-imports */
/**
 * Tabs.
 */
import type { FC, ReactNode } from 'react'
import { useCallback, useRef, useState } from 'react'
import { useClickOutside } from '~/libs/shared/lib/hooks'
import { IconCheck } from '~/libs/ui'
import classNames from 'classnames'
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
                        {item.warning ? (
                            // Global class 'icon-warning' defined in review app styles
                            <span className={classNames('icon-warning', styles.warningIcon)} />
                        ) : item.completed ? (
                            <IconCheck className={styles.completedIcon} />
                        ) : undefined}
                    </button>
                ))}
            </div>

            {props.rightContent}
        </div>
    )
}

export default Tabs
