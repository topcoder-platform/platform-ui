/**
 * The QA app.
 */
import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { Layout, QaAppContextProvider } from './lib'
import { toolTitle } from './qa-app.routes'
import './lib/styles/index.scss'

const QaApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    useEffect(() => {
        document.body.classList.add('qa-app')
        return () => {
            document.body.classList.remove('qa-app')
        }
    }, [])

    return (
        <QaAppContextProvider>
            <Layout>
                <Outlet />
                <Routes>{childRoutes}</Routes>
            </Layout>
        </QaAppContextProvider>
    )
}

export default QaApp
