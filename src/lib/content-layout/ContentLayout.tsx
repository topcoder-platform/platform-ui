import classNames from 'classnames'
import { FC, ReactNode, useContext } from 'react'

import { ProfileContext, ProfileContextData } from '../profile-provider'
import { PlatformRoute, RouteContextData } from '../route-provider'
import RouteContext from '../route-provider/route.context' // cannot be imported from index file
import '../styles/index.scss'

import styles from './ContentLayout.module.scss'
import { Sections, SectionSelectorProps } from './sections'

export interface ContentLayoutProps {
    children?: ReactNode
    classNames?: string
    sections?: Array<SectionSelectorProps>
    title: string
}

const ContentLayout: FC<ContentLayoutProps> = (props: ContentLayoutProps) => {

    const { profile }: ProfileContextData = useContext(ProfileContext)
    const { enabledRoutes }: RouteContextData = useContext(RouteContext)

    const rootRoute: PlatformRoute | undefined = enabledRoutes
        .find(route => route.title === props.title && route.enabled)

    const sections: Array<SectionSelectorProps> = rootRoute?.children
        .filter(sectionRoute => sectionRoute.enabled)
        .map(sectionRoute => ({
            sectionRoute,
            toolRoute: rootRoute.route,
        }))
        || []
    const hideSectionsClass: string = !!sections.length ? '' : styles['hide-sections']

    return (
        <>
            <div className={classNames(styles.content, props.classNames, hideSectionsClass)}>
                <Sections sections={sections}></Sections>
                <div>
                    <h1>{props.title}</h1>
                    {props.children}
                    <div>
                        Logged in as: {profile?.handle || 'Not Logged In'}
                    </div>
                </div>
            </div>
        </>
    )
}

export default ContentLayout
