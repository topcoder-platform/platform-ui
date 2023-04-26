import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import styles from './StickySidebar.module.scss'

interface StickySidebarProps {
    children: ReactNode
    className?: string
}

const StickySidebar: FC<StickySidebarProps> = (props: StickySidebarProps) => (
    <div className={styles['sticky-container']}>
        <div className={classNames(styles.wrap, props.className)}>
            {props.children}
        </div>
    </div>
)

export default StickySidebar
