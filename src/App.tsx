import { FC } from 'react'
import { Route, Routes } from 'react-router-dom'

import { EnvironmentConfig, RouteConfig } from './config'
import { Header } from './header'
import { AnalyticsService, LoggingService, ProfileProvider } from './lib'
import { DesignLib, SelfService, Tool } from './tools'
import { Home } from './utils'

new AnalyticsService().initialize(EnvironmentConfig)
new LoggingService().initialize(EnvironmentConfig)

const App: FC<{}> = () => {
    return (
        <ProfileProvider>
            <Header />
            <Routes>
                <Route path={`${RouteConfig.designLib}/*`} element={<DesignLib />} />
                <Route path={RouteConfig.home} element={<Home />} />
                <Route path={RouteConfig.selfService} element={<SelfService />} />
                <Route path={RouteConfig.tool} element={<Tool />} />
            </Routes >
        </ProfileProvider>
    )
}

export default App
