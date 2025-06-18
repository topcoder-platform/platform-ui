import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { AdminAppContextProvider, Layout, SWRConfigProvider } from './lib'
import { toolTitle } from './admin-app.routes'
import './lib/styles/index.scss'

/**
 * The admin app.
 */
const AdminApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- missing dependency: getChildRoutes
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [])

    useEffect(() => {
        document.body.classList.add('admin-app')
        return () => {
            document.body.classList.remove('admin-app')
        }
    }, [])

    return (
        <div>
            <AdminAppContextProvider>
                <SWRConfigProvider>
                    <Layout>
                        <Outlet />
                        <Routes>{childRoutes}</Routes>
                    </Layout>
                </SWRConfigProvider>
            </AdminAppContextProvider>
        </div>
    )
}

export default AdminApp
