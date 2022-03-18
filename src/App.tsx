import { FC, ReactElement, useContext } from 'react'
import { Route, Routes } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'

import { EnvironmentConfig } from './config'
import { Header } from './header'
import { analyticsInitialize, logInitialize, ProfileProvider } from './lib'
import { RouteContext, RouteContextData } from './lib/route-provider'

analyticsInitialize(EnvironmentConfig)
logInitialize(EnvironmentConfig)

const App: FC<{}> = () => {

    const { toolsRoutes, utilsRoutes }: RouteContextData = useContext(RouteContext)

    const routeElements: Array<ReactElement> = [
        ...toolsRoutes,
        ...utilsRoutes,
    ]
        .map(route => {
            // if the route has children, add the wildcard to the path
            const path: string = `${route.route}${!route.children ? '' : '/*'}`
            return (<Route path={path} element={route.element} key={route.title} />)
        })

    return (
        <ProfileProvider>
            <Header />
            <Routes>
                {routeElements}
            </Routes >
            <ToastContainer
                position={toast.POSITION.BOTTOM_CENTER}
                autoClose={3000}
                hideProgressBar
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </ProfileProvider>
    )
}

export default App
