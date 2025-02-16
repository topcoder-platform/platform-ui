import { FC, PropsWithChildren } from 'react'
import cn from 'classnames'

import styles from './PageHeader.module.scss'

const PageHeader: FC<PropsWithChildren> = props => (
    <div className={cn(styles.pageHeader)}>
        <div className={styles.inner}>{props.children}</div>
    </div>
)

export default PageHeader
