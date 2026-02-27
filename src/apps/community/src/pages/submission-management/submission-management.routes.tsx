import { PlatformRoute } from '~/libs/core'

import { submissionManagementRouteId } from '../../config/routes.config'

import SubmissionManagementPage from './SubmissionManagementPage'

/**
 * Route definitions for submission management page module.
 */
export const submissionManagementRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        element: <SubmissionManagementPage />,
        route: submissionManagementRouteId,
    },
]
