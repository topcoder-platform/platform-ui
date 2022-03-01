// TODO: import styles from './App.scss'
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'

import DesignLib from './content/design-lib/DesignLib'
import Home from './content/home/Home'
import Menu from './content/menu/Menu'
import SelfService from './content/self-service/SelfService'
import Tool from './content/tool/Tool'
import Header from './header/Header'
import { AppState } from './lib/interfaces'
import { AuthenticationService } from './lib/services'
import { UiRoute } from './lib/urls'

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

        // TODO: move this to the provider
        // try to get a profile
        authenticationService.authenticate(appState)
            .then(updatedAppState => setAppState(updatedAppState))
    }, [])

    // TODO: make routes configurable
    const routes: UiRoute = new UiRoute()

    return (
        <>
            <Header initialized={!!appState.auth.initialized} profile={appState.profile} />
            <Routes>
                <Route path={routes.designLib} element={<DesignLib profile={appState.profile} />} />
                <Route path={routes.home} element={<Home profile={appState.profile} />} />
                <Route path={routes.menu} element={<Menu />} />
                <Route path={routes.selfService} element={<SelfService profile={appState.profile} />} />
                <Route path={routes.tool} element={<Tool profile={appState.profile} />} />
            </Routes>
        </>
    )
}

export default App
