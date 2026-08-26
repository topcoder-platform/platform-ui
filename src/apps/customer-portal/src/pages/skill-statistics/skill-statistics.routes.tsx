import { getRoutesContainer, lazyLoad, LazyLoadedComponent } from '~/libs/core'

import { skillStatisticsRouteId } from '../../config/routes.config'

const SkillStatisticsPage: LazyLoadedComponent = lazyLoad(
    () => import('./SkillStatisticsPage'),
    'SkillStatisticsPage',
)

export const skillStatisticsChildRoutes = [
    {
        authRequired: true,
        element: <SkillStatisticsPage />,
        id: 'skill-statistics-page',
        route: '',
    },
]

export const customerPortalSkillStatisticsRoutes = [
    {
        children: [...skillStatisticsChildRoutes],
        element: getRoutesContainer(skillStatisticsChildRoutes),
        id: skillStatisticsRouteId,
        route: skillStatisticsRouteId,
    },
]
