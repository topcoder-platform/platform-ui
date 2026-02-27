import { PlatformRoute } from '~/libs/core'

import { challengeListingRouteId } from '../../config/routes.config'

import ChallengeListing from './ChallengeListing'

/**
 * Route definitions for the challenge listing page module.
 */
export const challengeListingRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: false,
        element: <ChallengeListing />,
        route: challengeListingRouteId,
    },
]
