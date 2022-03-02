// TODO: import styles from './App.scss'
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
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
import { AppState, AuthenticationService } from './lib'

const App: FC<{}> = () => {

    const [appState, setAppState]: [AppState, Dispatch<SetStateAction<AppState>>] = useState<AppState>({
        auth: {},
    })

    useEffect(() => {

        // if we have already have the profile, don't do anything else
        if (!!appState?.profile) {
            return
        }

        (async () => {
            // TODO: move this to the provider
            // try to get a profile
            const updatedAppState: AppState = await new AuthenticationService().authenticate(appState)
            setAppState(updatedAppState)
        })()
    }, [
        appState,
    ])

    // TODO: make routes configurable and defined in the content section instead of hard-coded here
    const routes: RouteConfig = new RouteConfig()
    const designLibRoutes: DesignLibRouteConfig = new DesignLibRouteConfig()

    return (
        <>
            <Header initialized={!!appState.auth.initialized} profile={appState.profile} />
            <Routes>
                <Route path={routes.designLib} element={<DesignLib profile={appState.profile} />} />
                <Route path={routes.home} element={<Home profile={appState.profile} />} />
                <Route path={routes.toolSelections} element={<ToolSelectorNarrow />} />
                <Route path={routes.selfService} element={<SelfService profile={appState.profile} />} />
                <Route path={routes.tool} element={<Tool profile={appState.profile} />} />
                <Route path={designLibRoutes.buttons} element={< Buttons />} />
                <Route path={designLibRoutes.fonts} element={< Fonts />} />
                <Route path={designLibRoutes.icons} element={< Icons />} />
            </Routes >
        </>
    )
}

export default App
