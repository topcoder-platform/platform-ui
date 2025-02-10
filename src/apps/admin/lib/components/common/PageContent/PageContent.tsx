import { FC, PropsWithChildren } from 'react'

import styles from './PageContent.module.scss'

const PageContent: FC<PropsWithChildren> = props => (
    <div className={styles.pageContent}>
        <div className={styles.inner}>{props.children}</div>
    </div>
)

export default PageContent
