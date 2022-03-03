import classNames from 'classnames'
import { FC, useContext } from 'react'

import { ProfileContext, ProfileContextData } from '../profile-provider'
import '../styles/index.scss'

import styles from './ContentLayout.module.scss'
import { Sections, SectionSelectorProps } from './sections'

export interface ContentLayoutProps {
    children: JSX.Element
    classNames?: string
    sections?: Array<SectionSelectorProps>
}

const ContentLayout: FC<ContentLayoutProps> = (props: ContentLayoutProps) => {

    const { profile }: ProfileContextData = useContext(ProfileContext)

    return (
        <>
            <div className={classNames(styles.content, props.classNames)}>
                <Sections sections={props.sections || []}></Sections>
                {props.children}
                <div>
                    Logged in as: {profile?.handle || 'Not Logged In'}
                </div>
            </div>
        </>
    )
}

export default ContentLayout
