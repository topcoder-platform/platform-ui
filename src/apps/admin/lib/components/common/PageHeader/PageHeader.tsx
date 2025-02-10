import { FC, PropsWithChildren } from 'react'
import cn from 'classnames'
import styles from './PageHeader.module.scss'

interface PageHeaderProps {
  noBackground?: boolean
}

const PageHeader: FC<PropsWithChildren<PageHeaderProps>> = ({ children, noBackground = false }) => (
    <div className={cn(styles.pageHeader, { [styles.noBg]: noBackground })}>
        <div className={styles.inner}>{children}</div>
    </div>
)

export default PageHeader
