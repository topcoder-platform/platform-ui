import { Dispatch, FC, ReactElement, SetStateAction, useContext, useEffect, useState } from 'react'
import { Routes } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'

import { Header } from './header'
import { routeContext, RouteContextData } from './lib'

const App: FC<{}> = () => {

    const [ready, setReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)
    const { allRoutes, getRouteElement }: RouteContextData = useContext(routeContext)

    const routeElements: Array<ReactElement> = allRoutes
        .map(route => getRouteElement(route))

    useEffect(() => {
        setReady(true)
    }, [])

    useEffect(() => {
        if (ready) {
            document.getElementById('root')?.classList.add('app-ready');
        }
    }, [ready]);

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
