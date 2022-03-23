import classNames from 'classnames'
import { FC, ReactNode, /* useContext */ } from 'react'

<<<<<<< HEAD
import { PlatformRoute, RouteContextData } from '../route-provider'
import RouteContext from '../route-provider/route.context' // cannot be imported from index file
=======
/* import { PlatformRoute, RouteContextData } from '../route-provider'
import RouteContext from '../route-provider/route.context' // cannot be imported from index file */
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
import '../styles/index.scss'

import styles from './ContentLayout.module.scss'
import { /* Sections, */ SectionSelectorProps } from './sections'

export interface ContentLayoutProps {
    children?: ReactNode
    classNames?: string
    sections?: Array<SectionSelectorProps>
    title: string
}

// TODO: uncomment everything related to sections when we have the UI determined
const ContentLayout: FC<ContentLayoutProps> = (props: ContentLayoutProps) => {

<<<<<<< HEAD
    const { toolsRoutes, utilsRoutes }: RouteContextData = useContext(RouteContext)
=======
/*     const { allRoutes }: RouteContextData = useContext(RouteContext)
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22

    const rootRoute: PlatformRoute | undefined = allRoutes
        .find(route => route.title === props.title && route.enabled)

    const sections: Array<SectionSelectorProps> = rootRoute?.children
        .filter(sectionRoute => sectionRoute.enabled)
        .map(sectionRoute => ({
            sectionRoute,
            toolRoute: rootRoute.route,
        }))
        || []
<<<<<<< HEAD
    const hideSectionsClass: string = !sections.length ? '' : styles['show-sections']

    return (
        <>
            <div className={classNames(styles.content, props.classNames, hideSectionsClass)}>

                <Sections sections={sections}></Sections>
=======
    const hideSectionsClass: string = !sections.length ? '' : styles['show-sections'] */

    return (
        <>
            <div className={classNames(styles.content, props.classNames/* , hideSectionsClass */)}>

                {/* <Sections sections={sections}></Sections> */}
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22

                <div className={styles['content-outer']}>

                    <div className={styles['content-inner']}>

<<<<<<< HEAD
                        <h1>{props.title}</h1>
=======
                        {/* TODO: the title on the page should be an h1 tag, not h4 */}
                        <h4>{props.title}</h4>
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22

                        {props.children}

                    </div>

                </div>

            </div>
        </>
    )
}

export default ContentLayout
