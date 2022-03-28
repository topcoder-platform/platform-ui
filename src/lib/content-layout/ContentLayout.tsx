import classNames from 'classnames'
import { FC, ReactNode } from 'react'

import '../styles/index.scss'

import styles from './ContentLayout.module.scss'

export interface ContentLayoutProps {
    children?: ReactNode
    classNames?: string
    title: string
}

const ContentLayout: FC<ContentLayoutProps> = (props: ContentLayoutProps) => {

    return (
        <div className={classNames(styles.content, props.classNames)}>

            <div className={styles['content-outer']}>

                <div className={styles['content-inner']}>

                    <h1>{props.title}</h1>

                    {props.children}

                </div>

            </div>

        </div>
    )
}

export default ContentLayout
