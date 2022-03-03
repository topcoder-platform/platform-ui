import { Dispatch, FC, SetStateAction, useState } from 'react'
import { Route, Routes } from 'react-router-dom'

import { RouteConfig } from './config'
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
import { ProfileProvider } from './lib/profile-provider'
import { ProfileContextData } from './lib/profile-provider/profile-context-data.model'

const App: FC<{}> = () => {

    const [profileContext]: [ProfileContextData, Dispatch<SetStateAction<ProfileContextData>>] = useState<ProfileContextData>({ initialized: false })

    // TODO: make routes configurable and defined in the content section instead of hard-coded here
    const routes: RouteConfig = new RouteConfig()
    const designLibRoutes: DesignLibRouteConfig = new DesignLibRouteConfig()

    return (
        <ProfileProvider>
            <Header />
            <Routes>
                <Route path={routes.designLib} element={<DesignLib profile={profileContext.profile} />} />
                <Route path={routes.home} element={<Home profile={profileContext.profile} />} />
                <Route path={routes.toolSelectors} element={<ToolSelectorNarrow />} />
                <Route path={routes.selfService} element={<SelfService profile={profileContext.profile} />} />
                <Route path={routes.tool} element={<Tool profile={profileContext.profile} />} />
                <Route path={designLibRoutes.buttons} element={< Buttons />} />
                <Route path={designLibRoutes.fonts} element={< Fonts />} />
                <Route path={designLibRoutes.icons} element={< Icons />} />
            </Routes >
        </ProfileProvider>
    )
}

export default App
