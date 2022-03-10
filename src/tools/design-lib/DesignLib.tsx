import { FC, ReactElement, useContext } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'

import { ContentLayout, RouteContext, RouteContextData } from '../../lib'

import styles from './DesignLib.module.scss'
import { sections } from './sections.config'

const DesignLib: FC<{}> = () => {

    const { routes }: RouteContextData = useContext(RouteContext)

    const routeElements: Array<ReactElement> = routes
        .find(route => route.title === 'Design Library' && route.enabled)
        ?.children
        .map(route => (<Route path={route.route} element={route.element} key={route.title} />))
        || []

    return (
        <>
            <ContentLayout classNames={styles['design-lib']} sections={sections}>
                <>
                    <h1>Design Library</h1>
                    <Outlet />
                    <Routes>
                        {routeElements}
                    </Routes>
                </>
            </ContentLayout>
        </>
    )
}

export default DesignLib
