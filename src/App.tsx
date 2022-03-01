// TODO: import styles from './App.scss'
import { Route, Routes } from 'react-router-dom'

import Header from './header/Header'
import Placeholder from './lib/placeholder/Placeholder'
import { UiRoute } from './lib/urls'

const App: () => JSX.Element = () => {

    // TODO: determine the best way to inject this
    // so we don't have to new it up every time.
    // it's not a singleton, so this is good for now.
    const routes: UiRoute = new UiRoute()

    return (
        <>
            <Header />
            <Routes>
                <Route path={routes.designLibFonts} element={<Placeholder title='Design Library Fonts' />} />
                <Route path={routes.designLib} element={<Placeholder title='Design Library' />} />
                <Route path={routes.home} element={<Placeholder title='Platform UI Home' />} />
            </Routes>
        </>
    )
}

export default App
