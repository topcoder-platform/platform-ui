import classNames from 'classnames'
import { FC } from 'react'

import { ProfileProps } from '../interfaces'
import '../styles/index.scss'

import styles from './ContentLayout.module.scss'

export interface ContentLayoutProps extends ProfileProps {
    children: JSX.Element
    classNames?: string
}

const ContentLayout: FC<ContentLayoutProps> = (props: ContentLayoutProps) => {
    return (
        <>
            <div className={classNames(styles.content, props.classNames)}>
                {props.children}
                <div>
                    Logged in as: {props.profile?.handle || 'Not Logged In'}
                </div>
            </div>
        </>
    )
}

export default ContentLayout
