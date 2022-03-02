import classNames from 'classnames'
import { FC } from 'react'

import { UserProfile } from '../profile-service'
import '../styles/index.scss'

import styles from './ContentLayout.module.scss'
import { Sections, SectionSelectorProps } from './sections'

export interface ContentLayoutProps {
    children: JSX.Element
    classNames?: string
    profile?: UserProfile
    sections?: Array<SectionSelectorProps>
}

const ContentLayout: FC<ContentLayoutProps> = (props: ContentLayoutProps) => {
    return (
        <>
            <div className={classNames(styles.content, props.classNames)}>
                <Sections sections={props.sections || []}></Sections>
                {props.children}
                <div>
                    Logged in as: {props.profile?.handle || 'Not Logged In'}
                </div>
            </div>
        </>
    )
}

export default ContentLayout
