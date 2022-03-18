import classNames from 'classnames'
import { FC, ReactNode, useContext } from 'react'

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

    const { toolsRoutes, utilsRoutes }: RouteContextData = useContext(RouteContext)

    const rootRoute: PlatformRoute | undefined = [
        ...toolsRoutes,
        ...utilsRoutes,
    ]
        .find(route => route.title === props.title && route.enabled)

    const sections: Array<SectionSelectorProps> = rootRoute?.children
        .filter(sectionRoute => sectionRoute.enabled)
        .map(sectionRoute => ({
            sectionRoute,
            toolRoute: rootRoute.route,
        }))
        || []
    const hideSectionsClass: string = !sections.length ? '' : styles['show-sections']

    return (
        <>
            <div className={classNames(styles.content, props.classNames, hideSectionsClass)}>

                <Sections sections={sections}></Sections>

                <div className={styles['content-outer']}>

                    <div className={styles['content-inner']}>

                        {/* TODO: the title on the page should be an h1 tag, not h4 */}
                        <h4>{props.title}</h4>

                        {props.children}

                    </div>

                </div>

            </div>
        </>
    )
}

export default ContentLayout
