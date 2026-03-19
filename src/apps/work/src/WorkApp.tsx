import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { Layout, SWRConfigProvider, WorkAppContextProvider, WORK_APP_BODY_CLASS } from './lib'
import { toolTitle } from './work-app.routes'
import './lib/styles/index.scss'

const WorkApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    useEffect(() => {
        document.body.classList.add(WORK_APP_BODY_CLASS)
        return () => {
            document.body.classList.remove(WORK_APP_BODY_CLASS)
        }
    }, [])

    return (
        <WorkAppContextProvider>
            <SWRConfigProvider>
                <Layout>
                    <Outlet />
                    <Routes>{childRoutes}</Routes>
                </Layout>
            </SWRConfigProvider>
        </WorkAppContextProvider>
    )
}

export default WorkApp
