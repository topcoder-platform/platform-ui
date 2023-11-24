import { FC, PropsWithChildren } from 'react'

import styles from './PageHeader.module.scss'

interface PageHeaderProps extends PropsWithChildren {
    title: string
}

const PageHeader: FC<PageHeaderProps> = props => (
    <div className={styles.wrap}>
        <div className={styles.inner}>
            <h1>{props.title}</h1>

            <div className={styles.content}>
                {props.children}
            </div>
        </div>

        <hr />
    </div>
)

export default PageHeader
