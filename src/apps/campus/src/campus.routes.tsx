import { Navigate } from 'react-router-dom'

import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

const CampusApp: LazyLoadedComponent = lazyLoad(() => import('./CampusApp'))
const CampusLeaderboardPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/leaderboard'),
    'CampusLeaderboardPage',
)

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.campus ? '' : `/${AppSubdomain.campus}`
)

export const toolTitle: string = ToolTitle.campus

export const campusRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                element: <Navigate replace to={`${rootRoute}/mecw`} />,
                route: '',
            },
            {
                // Campus program leaderboard, eg. https://campus.topcoder-dev.com/mecw
                children: [],
                element: <CampusLeaderboardPage />,
                id: 'Campus Leaderboard',
                route: ':groupName',
            },
        ],
        domain: AppSubdomain.campus,
        element: <CampusApp />,
        id: toolTitle,
        route: rootRoute,
        title: toolTitle,
    },
]
