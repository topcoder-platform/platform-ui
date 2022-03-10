import { FC, ReactElement, useContext } from 'react'
import { Route, Routes } from 'react-router-dom'

import { EnvironmentConfig } from './config'
import { Header } from './header'
import { AnalyticsService, LoggingService, ProfileProvider } from './lib'
import { RouteContext, RouteContextData } from './lib/route-provider'

new AnalyticsService().initialize(EnvironmentConfig)
new LoggingService().initialize(EnvironmentConfig)

const App: FC<{}> = () => {

    const { toolsRoutes, utilsRoutes }: RouteContextData = useContext(RouteContext)

    const routeElements: Array<ReactElement> = [
        ...toolsRoutes,
        ...utilsRoutes,
    ]
        .map(route => {
            // if the route has children, add the wildcard to the path
            const path: string = `${route.route}${!route.children ? '' : '/*'}`
            return (<Route path={path} element={route.element} key={route.title} />)
        })

    return (
        <ProfileProvider>
            <Header />
            <Routes>
                {routeElements}
            </Routes >
        </ProfileProvider>
    )
}

export default App
