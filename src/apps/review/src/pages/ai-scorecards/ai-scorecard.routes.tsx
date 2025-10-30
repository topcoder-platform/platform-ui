import { getRoutesContainer, lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'

import { aiScorecardRouteId } from '../../config/routes.config'

const AiScorecardViewer: LazyLoadedComponent = lazyLoad(() => import('./AiScorecardViewer'), 'AiScorecardViewer')
const AiScorecardContextProvider: LazyLoadedComponent = lazyLoad(() => import('./AiScorecardContext'), 'AiScorecardContextProvider')

export const aiScorecardChildRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: false,
        element: <AiScorecardViewer />,
        id: 'view-ai-scorecard-page',
        route: '',
    },
]

// const AiScorecardsContainer = getRoutesContainer(aiScorecardChildRoutes);

export const aiScorecardRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [ ...aiScorecardChildRoutes ],
        element: getRoutesContainer(aiScorecardChildRoutes, AiScorecardContextProvider),
        id: aiScorecardRouteId,
        rolesRequired: [
            // UserRole.administrator,
        ],
        route: `${aiScorecardRouteId}/:submissionId/:workflowId`,
    }
]
