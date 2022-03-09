import { FC } from 'react'
import { Route, Routes } from 'react-router-dom'

import { EnvironmentConfig, RouteConfig } from './config'
import { Header } from './header'
import { AnalyticsService, LoggingService, ProfileProvider } from './lib'
import {
    Buttons,
    DesignLib,
    DesignLibRouteConfig,
    Fonts,
    Icons,
    SelfService,
    Tool
} from './tools'
import { Home } from './utils'

new AnalyticsService().initialize(EnvironmentConfig)
new LoggingService().initialize(EnvironmentConfig)

const App: FC<{}> = () => {

    // TODO: make routes configurable and defined in the content section instead of hard-coded here
    const routes: RouteConfig = new RouteConfig()
    const designLibRoutes: DesignLibRouteConfig = new DesignLibRouteConfig()

    return (
        <ProfileProvider>
            <Header />
            <Routes>
                <Route path={routes.designLib} element={<DesignLib />} />
                <Route path={routes.home} element={<Home />} />
                <Route path={routes.selfService} element={<SelfService />} />
                <Route path={routes.tool} element={<Tool />} />
                <Route path={designLibRoutes.buttons} element={< Buttons />} />
                <Route path={designLibRoutes.fonts} element={< Fonts />} />
                <Route path={designLibRoutes.icons} element={< Icons />} />
            </Routes >
        </ProfileProvider>
    )
}

export default App
