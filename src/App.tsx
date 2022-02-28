// TODO: import styles from './App.scss'
import { Component } from 'react'
import { Route, Routes } from 'react-router-dom'

import Header from './header/Header'
import { AppState } from './lib/interfaces'
import Placeholder from './lib/placeholder/Placeholder'
import { AuthenticationService } from './lib/services'
import { UiRoute } from './lib/urls'

class App extends Component<{}, AppState> {

    // TODO: determine the best way to inject these
    // so we don't have to new it up every time.
    // it's not a singleton, so this is good for now.
    private readonly authenticationService: AuthenticationService = new AuthenticationService()
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
                <Routes>
                    <Route path={this.routes.designLibFonts} element={<Placeholder title='Design Library Fonts' />} />
                    <Route path={this.routes.designLib} element={<Placeholder title='Design Library' />} />
                    <Route path={this.routes.home} element={<Placeholder title='Platform UI Home' />} />
                    <Route path={this.routes.selfService} element={<Placeholder title='Self Service' />} />
                    <Route path={this.routes.tool} element={<Placeholder title='Tool' />} />
                </Routes>
            </>
        )
    }
}

export default App
