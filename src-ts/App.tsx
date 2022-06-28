import { FC, ReactElement, useContext } from 'react'
import { Routes } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'

import { EnvironmentConfig } from './config'
import { Header } from './header'
import { analyticsInitialize, logInitialize, routeContext, RouteContextData } from './lib'

analyticsInitialize(EnvironmentConfig)
logInitialize(EnvironmentConfig)

const App: FC<{}> = () => {

    const { allRoutes, getRouteElement }: RouteContextData = useContext(routeContext)

    const routeElements: Array<ReactElement> = allRoutes
        .map(route => getRouteElement(route))

    return (
        <>
            <Header />
            <Routes>
                {routeElements}
            </Routes >
            <ToastContainer
                position={toast.POSITION.TOP_RIGHT}
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </>
    )
}

export default App
