import { FC } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'
import { getRoutesContainer, lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'

const StatisticsPage: LazyLoadedComponent = lazyLoad(() => import('./StatisticsPage'))
export const statisticsRoot = EnvironmentConfig.SUBDOMAIN === AppSubdomain.statistics ? '' : '/statistics'

const LegacyStatisticsRedirect: FC = () => {
    const location = useLocation()
    const path = location.pathname.replace(/^\/community\/statistics/, '/statistics')
    return <Navigate replace to={`${path}${location.search}${location.hash}`} />
}

const children: PlatformRoute[] = [{ element: <StatisticsPage />, id: 'Statistics page', route: '*' }]

export const statisticsRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children,
        domain: AppSubdomain.statistics,
        element: getRoutesContainer(children),
        id: ToolTitle.statistics,
        route: statisticsRoot,
        title: ToolTitle.statistics,
    },
    {
        element: <LegacyStatisticsRedirect />,
        id: 'Legacy statistics',
        route: '/community/statistics/*',
    },
]
