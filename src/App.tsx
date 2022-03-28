import { FC, ReactElement, useContext } from 'react'
import { Route, Routes } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'

import { EnvironmentConfig } from './config'
import { Header } from './header'
import { analyticsInitialize, logInitialize, ProfileProvider, MyWorkProvider } from './lib'
import { RouteContext, RouteContextData } from './lib/route-provider'

analyticsInitialize(EnvironmentConfig)
logInitialize(EnvironmentConfig)

const App: FC<{}> = () => {

    const { allRoutes }: RouteContextData = useContext(RouteContext)

    const routeElements: Array<ReactElement> = allRoutes
        .map(route => {
            // if the route has children, add the wildcard to the path
            const path: string = `${route.route}${!route.children ? '' : '/*'}`
            return (<Route path={path} element={route.element} key={route.title} />)
        })

    return (
        <ProfileProvider>
            <Header />
            <MyWorkProvider>
                <Routes>
                    {routeElements}
                </Routes >
            </MyWorkProvider>
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
        </ProfileProvider>
    )
}

export default App
