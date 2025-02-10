import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes, useLocation } from 'react-router-dom'
import { routerContext, RouterContextData } from '~/libs/core'
import { NullLayout, SWRConfigProvider } from './lib'
import { adminRoutes, toolTitle } from './admin-app.routes'
import ChallengeManagement from './challenge-management/ChallengeManagement'
import './lib/styles/index.scss'

/**
 * The admin app.
 */
const AdminApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const AppLayout = getAppLayout()

    useEffect(() => {
        document.body.classList.add('admin-app')
        return () => {
            document.body.classList.remove('admin-app')
        }
    }, [])

    return (
        <div>
            <SWRConfigProvider>
                <AppLayout>
                    <Outlet />
                    <Routes>{useMemo(() => getChildRoutes(toolTitle), [])}</Routes>
                </AppLayout>
            </SWRConfigProvider>
        </div>
    )
}

function getAppLayout() {
    const challengeManagementPath = adminRoutes[0].children!.find(r => r.id === 'challenge-management')!.route
    const locationPath = useLocation().pathname

    if (locationPath.includes(challengeManagementPath)) {
        return ChallengeManagement.Layout
    }

    return NullLayout
}

export default AdminApp
