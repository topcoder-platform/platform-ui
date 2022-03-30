import classNames from 'classnames'
import { FC, ReactNode } from 'react'

import '../styles/index.scss'

import styles from './ContentLayout.module.scss'

export interface ContentLayoutProps {
    children?: ReactNode
    contentClass?: string
    title: string
    titleClass?: string
}

const ContentLayout: FC<ContentLayoutProps> = (props: ContentLayoutProps) => {

    return (
        <div className={classNames(styles.content, props.contentClass)}>

            <div className={styles['content-outer']}>

                <div className={styles['content-inner']}>

                    <div className={classNames(styles['page-header'], props.titleClass)}>

                        <h1>{props.title}</h1>

                    </div>

                    {props.children}

                </div>

            </div>

        </div>
    )
}

export default ContentLayout
