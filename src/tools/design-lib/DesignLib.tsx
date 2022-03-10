import { FC, ReactElement, useContext } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'

import { ContentLayout, RouteContext, RouteContextData } from '../../lib'

import styles from './DesignLib.module.scss'

export const toolTitle: string = 'Design Library'

const DesignLib: FC<{}> = () => {

    const { toolsRoutes }: RouteContextData = useContext(RouteContext)

    const routeElements: Array<ReactElement> = toolsRoutes
        .find(route => route.title === toolTitle)
        ?.children
        .map(route => (<Route path={route.route} element={route.element} key={route.title} />))
        || []

    return (
        <>
            <ContentLayout classNames={styles['design-lib']} title={toolTitle}>
                <>
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
