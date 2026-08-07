import { getRoutesContainer, lazyLoad, LazyLoadedComponent } from '~/libs/core'

import { statisticsRouteId } from '../../config/routes.config'

const StatisticsPage: LazyLoadedComponent = lazyLoad(
    () => import('./StatisticsPage'),
    'StatisticsPage',
)

export const statisticsChildRoutes = [
    {
        authRequired: true,
        element: <StatisticsPage />,
        id: 'statistics-page',
        route: '',
    },
]

export const customerPortalStatisticsRoutes = [
    {
        children: [...statisticsChildRoutes],
        element: getRoutesContainer(statisticsChildRoutes),
        id: statisticsRouteId,
        route: statisticsRouteId,
    },
]
