/**
 * Tabs.
 */
import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import styles from './Tabs.module.scss'

interface Props {
    className?: string
    items: string[]
    selectedIndex: number
    onChange?: (selectedIndex: number) => void
    rightContent?: ReactNode
}

export const Tabs: FC<Props> = (props: Props) => (
    <div className={classNames(styles.container, props.className)}>
        <div className={styles.blockLeft}>
            {props.items.map((item, index) => (
                <button
                    type='button'
                    onClick={function onClick() {
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

export default Tabs
