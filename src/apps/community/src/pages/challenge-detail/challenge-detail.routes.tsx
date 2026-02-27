import { PlatformRoute } from '~/libs/core'

import { challengeDetailRouteId } from '../../config/routes.config'

import ChallengeDetail from './ChallengeDetail'

/**
 * Route definitions for the challenge detail page module.
 */
export const challengeDetailRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: false,
        element: <ChallengeDetail />,
        route: challengeDetailRouteId,
    },
]
