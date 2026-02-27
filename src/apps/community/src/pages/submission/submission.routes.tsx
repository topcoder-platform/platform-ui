import { PlatformRoute } from '~/libs/core'

import { submissionRouteId } from '../../config/routes.config'

import SubmissionPage from './SubmissionPage'

/**
 * Route definitions for the submission page module.
 */
export const submissionRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        element: <SubmissionPage />,
        route: submissionRouteId,
    },
]
