import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { ProfileProvider, routerContext, RouterContextData } from '~/libs/core'

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
        <ProfileProvider>
            <CalendarContextProvider>
                <SWRConfigProvider>
                    <Layout>
                        <Outlet />
                        <Routes>{childRoutes}</Routes>
                    </Layout>
                </SWRConfigProvider>
            </CalendarContextProvider>
        </ProfileProvider>
    )
}

export default CalendarApp
