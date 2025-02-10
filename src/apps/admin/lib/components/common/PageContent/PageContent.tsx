import { FC, PropsWithChildren } from 'react'
import styles from './PageContent.module.scss'

const PageContent: FC<PropsWithChildren> = ({ children }) => (
    <div className={styles.pageContent}>
        <div className={styles.inner}>{children}</div>
    </div>
)

export default PageContent
