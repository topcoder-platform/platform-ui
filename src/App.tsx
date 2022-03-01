// TODO: import styles from './App.scss'
import { Component } from 'react'
import { Route, Routes } from 'react-router-dom'

import Buttons from './content/design-lib/buttons/Buttons'
import DesignLib from './content/design-lib/Design-Lib'
import { DesignLibRoute } from './content/design-lib/design-lib-route.service'
import Fonts from './content/design-lib/fonts/Fonts'
import Icons from './content/design-lib/icons/Icons'
import Home from './content/home/Home'
import Menu from './content/menu/Menu'
import SelfService from './content/self-service/Self-Service'
import Tool from './content/tool/Tool'
import Header from './header/Header'
import { AppState, AuthenticationService, UiRoute } from './lib'

class App extends Component<{}, AppState> {

    // TODO: determine the best way to inject these
    // so we don't have to new it up every time.
    // it's not a singleton, so this is good for now.
    private readonly authenticationService: AuthenticationService = new AuthenticationService()
    private readonly designLibRoutes: DesignLibRoute = new DesignLibRoute()
    private readonly routes: UiRoute = new UiRoute()

    constructor(props: {}) {
        super(props)
        this.state = {
            auth: {},
        }
    }

    async componentDidMount(): Promise<void> {

        // if we have already have the profile, don't do anything else
        if (!!this.state.profile) {
            return Promise.resolve()
        }

        // TODO: this seems awfully late in the lifecycle to set the auth data.
        // it seems like there's got to be a way to make an async call before a component mounts

        // try to get a profile
        const appState: AppState = await this.authenticationService.authenticate(this.state)
        this.setState({
            ...appState,
        })
    }

    render(): JSX.Element {
        return (
            <>
                <Header initialized={!!this.state.auth.initialized} profile={this.state.profile} />
                {/* TODO: make this configurable */}
                <Routes>
                    <Route path={this.routes.designLib} element={<DesignLib profile={this.state.profile} />} />
                    <Route path={this.routes.home} element={<Home profile={this.state.profile} />} />
                    <Route path={this.routes.menu} element={<Menu />} />
                    <Route path={this.routes.selfService} element={<SelfService profile={this.state.profile} />} />
                    <Route path={this.routes.tool} element={<Tool profile={this.state.profile} />} />
                    {/* TODO: figure out how to define subsections routes in the section module instead of here */}
                    <Route path={this.designLibRoutes.buttons} element={<Buttons />} />
                    <Route path={this.designLibRoutes.fonts} element={<Fonts />} />
                    <Route path={this.designLibRoutes.icons} element={<Icons />} />
                </Routes>
            </>
        )
    }
}

export default App
