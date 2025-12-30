/**
 * The tester app.
 */
import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { Layout, SWRConfigProvider, TesterAppContextProvider } from './lib'
import { toolTitle } from './tester-app.routes'
import './lib/styles/index.scss'

const TesterApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    useEffect(() => {
        document.body.classList.add('tester-app')
        return () => {
            document.body.classList.remove('tester-app')
        }
    }, [])

    return (
        <TesterAppContextProvider>
            <SWRConfigProvider>
                <Layout>
                    <Outlet />
                    <Routes>{childRoutes}</Routes>
                </Layout>
            </SWRConfigProvider>
        </TesterAppContextProvider>
    )
}

export default TesterApp
