import classNames from 'classnames'
import { FC } from 'react'

import { ProfileProps, SectionSelectorProps } from '../interfaces'
import '../styles/index.scss'

import styles from './ContentLayout.module.scss'
import Sections from './sections/Sections'

export interface ContentLayoutProps extends ProfileProps {
    children: JSX.Element
    classNames?: string
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
