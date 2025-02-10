import { FC, PropsWithChildren } from 'react'
import cn from 'classnames'

import styles from './PageHeader.module.scss'

interface PageHeaderProps {
    noBackground?: boolean
}

const PageHeader: FC<PropsWithChildren<PageHeaderProps>> = props => (
    <div
        className={cn(styles.pageHeader, { [styles.noBg]: props.noBackground })}
    >
        <div className={styles.inner}>{props.children}</div>
    </div>
)

export default PageHeader
