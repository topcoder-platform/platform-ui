/**
 * Tabs.
 */
import { FC, ReactNode, useCallback, useRef, useState } from 'react'
import classNames from 'classnames'

import { useClickOutside } from '~/libs/shared/lib/hooks'

import styles from './Tabs.module.scss'

interface Props {
    className?: string
    items: string[]
    selectedIndex: number
    onChange?: (selectedIndex: number) => void
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
                {props.items[props.selectedIndex]}
            </span>
            <div className={styles.blockLeft}>
                {props.items.map((item, index) => (
                    <button
                        type='button'
                        onClick={function onClick() {
                            setIsOpen(false)
                            props.onChange?.(index)
                        }}
                        key={item}
                        className={classNames(styles.blockItem, {
                            [styles.selected]: index === props.selectedIndex,
                        })}
                    >
                        {item}
                    </button>
                ))}
            </div>

            {props.rightContent}
        </div>
    )
}

export default Tabs
