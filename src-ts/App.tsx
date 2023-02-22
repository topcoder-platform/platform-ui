import { FC, ReactElement, useContext } from 'react'
import { Routes } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'

import { Header } from './header'
import { routeContext, RouteContextData, useViewportUnitsFix } from './lib'

const App: FC<{}> = () => {

    const { allRoutes, getRouteElement }: RouteContextData = useContext(routeContext)

    const routeElements: Array<ReactElement> = allRoutes
        .map(route => getRouteElement(route))

    useViewportUnitsFix()

    return (
        <>
            <Header />
            <Routes>
                {routeElements}
            </Routes>
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
