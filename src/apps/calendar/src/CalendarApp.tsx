import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { CalendarContextProvider, Layout, SWRConfigProvider } from './lib'
import { toolTitle } from './calendar-app.routes'
import './lib/styles/index.scss'

const CalendarApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    useEffect(() => {
        document.body.classList.add('calendar-app')
        return () => {
            document.body.classList.remove('calendar-app')
        }
    }, [])

    return (
        <CalendarContextProvider>
            <SWRConfigProvider>
                <Layout>
                    <Outlet />
                    <Routes>{childRoutes}</Routes>
                </Layout>
            </SWRConfigProvider>
        </CalendarContextProvider>
    )
}

export default CalendarApp
