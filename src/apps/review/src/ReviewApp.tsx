/**
 * The review app.
 */
import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { Layout, SWRConfigProvider } from './lib'
import { toolTitle } from './review-app.routes'
import './lib/styles/index.scss'

const ReviewApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    useEffect(() => {
        document.body.classList.add('review-app')
        return () => {
            document.body.classList.remove('review-app')
        }
    }, [])

    return (
        <SWRConfigProvider>
            <Layout>
                <Outlet />
                <Routes>{childRoutes}</Routes>
            </Layout>
        </SWRConfigProvider>
    )
}

export default ReviewApp
