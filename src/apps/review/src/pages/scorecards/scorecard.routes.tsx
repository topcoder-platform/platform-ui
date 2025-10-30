import { getRoutesContainer, lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'

import { scorecardRouteId } from '../../config/routes.config'

const ScorecardsListPage: LazyLoadedComponent = lazyLoad(
    () => import('./ScorecardsListPage'),
    'ScorecardsListPage',
)

const ViewScorecardPage: LazyLoadedComponent = lazyLoad(
    () => import('./ViewScorecardPage'),
    'ViewScorecardPage',
)
const EditScorecardPage: LazyLoadedComponent = lazyLoad(
    () => import('./EditScorecardPage'),
    'EditScorecardPage',
)

export const scorecardChildRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        element: <ScorecardsListPage />,
        id: 'list-scorecards-page',
        rolesRequired: [UserRole.administrator],
        route: '',
    },
    {
        authRequired: true,
        element: <EditScorecardPage />,
        id: 'edit-scorecard-page',
        rolesRequired: [
            UserRole.administrator,
        ],
        route: ':scorecardId/edit',
    },
    {
        authRequired: true,
        element: <EditScorecardPage />,
        id: 'new-scorecard-page',
        rolesRequired: [
            UserRole.administrator,
        ],
        route: 'new',
    },
    {
        authRequired: false,
        element: <ViewScorecardPage />,
        id: 'view-scorecard-page',
        route: ':scorecardId',
    },

]

// const ScorecardsContainer = getRoutesContainer(scorecardChildRoutes)

export const scorecardRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [...scorecardChildRoutes],
        element: getRoutesContainer(scorecardChildRoutes),
        id: scorecardRouteId,
        rolesRequired: [
            UserRole.administrator,
        ],
        route: scorecardRouteId,
    },
]
