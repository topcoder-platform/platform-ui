import { FC } from 'react'
import { Route, Routes } from 'react-router-dom'

import { EnvironmentConfig, RouteConfig } from './config'
import {
    Buttons,
    DesignLib,
    DesignLibRouteConfig,
    Fonts,
    Home,
    Icons,
    SelfService,
    Tool
} from './content'
import { Header, ToolSelectorNarrow } from './header'
import { AnalyticsService, ProfileProvider } from './lib'

// initialize the tag manager
new AnalyticsService().initializeTagManager(EnvironmentConfig)

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
                <Route path={routes.toolSelectors} element={<ToolSelectorNarrow />} />
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
