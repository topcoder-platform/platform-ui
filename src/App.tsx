// TODO: import styles from './App.scss'
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'

import Buttons from './content/design-lib/buttons/Buttons'
import { DesignLibRoute } from './content/design-lib/design-lib-route.service'
import DesignLib from './content/design-lib/DesignLib'
import Fonts from './content/design-lib/fonts/Fonts'
import Icons from './content/design-lib/icons/Icons'
import Home from './content/home/Home'
import Menu from './content/menu/Menu'
import SelfService from './content/self-service/SelfService'
import Tool from './content/tool/Tool'
import Header from './header/Header'
import { AppState, AuthenticationService, UiRoute } from './lib'

const App: FC<{}> = () => {

    // TODO: convert auth service to a provider
    const authenticationService: AuthenticationService = new AuthenticationService()

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
            const updatedAppState: AppState = await authenticationService.authenticate(appState)
            setAppState(updatedAppState)
        })()
    }, [appState])

    // TODO: make routes configurable
    const routes: UiRoute = new UiRoute()
    const designLibRoutes: DesignLibRoute = new DesignLibRoute()

    return (
        <>
            <Header initialized={!!appState.auth.initialized} profile={appState.profile} />
            <Routes>
                <Route path={routes.designLib} element={<DesignLib profile={appState.profile} />} />
                <Route path={routes.home} element={<Home profile={appState.profile} />} />
                <Route path={routes.menu} element={<Menu />} />
                <Route path={routes.selfService} element={<SelfService profile={appState.profile} />} />
                <Route path={routes.tool} element={<Tool profile={appState.profile} />} />
                {/* TODO: figure out how to define subsections routes in the section module instead of here */}
                <Route path={designLibRoutes.buttons} element={< Buttons />} />
                <Route path={designLibRoutes.fonts} element={< Fonts />} />
                <Route path={designLibRoutes.icons} element={< Icons />} />
            </Routes >
        </>
    )
}

export default App
