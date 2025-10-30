import { getRoutesContainer, PlatformRoute, UserRole } from '~/libs/core'

import { aiScorecardRouteId } from '../../config/routes.config'

export const aiScorecardChildRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: false,
        element: <div>test</div>,
        id: 'view-ai-scorecard-page',
        route: ':scorecardId',
    },

]

// const AiScorecardsContainer = getRoutesContainer(aiScorecardChildRoutes);

export const aiScorecardRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [ ...aiScorecardChildRoutes ],
        element: getRoutesContainer(aiScorecardChildRoutes),
        id: aiScorecardRouteId,
        rolesRequired: [
            // UserRole.administrator,
        ],
        route: aiScorecardRouteId,
    }
]
