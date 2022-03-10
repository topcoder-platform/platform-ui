import { FC, ReactElement, useContext } from 'react'
import { Route, Routes } from 'react-router-dom'

import { EnvironmentConfig } from './config'
import { Header } from './header'
import { AnalyticsService, LoggingService, ProfileProvider } from './lib'
import { RouteContext, RouteContextData } from './lib/route-provider'

new AnalyticsService().initialize(EnvironmentConfig)
new LoggingService().initialize(EnvironmentConfig)

const App: FC<{}> = () => {

    const { routes }: RouteContextData = useContext(RouteContext)

    const routeElements: Array<ReactElement> = routes
        .map(route => (<Route path={route.route} element={route.element} key={route.title} />))

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
