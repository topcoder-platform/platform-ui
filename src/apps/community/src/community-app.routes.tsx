/**
 * App routes.
 */
import { AppSubdomain, ToolTitle } from '~/config'
import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
} from '~/libs/core'

import { rootRoute } from './config/routes.config'
import {
    challengeDetailRoutes,
    challengeListingRoutes,
    changelogRoutes,
    communityLoaderRoutes,
    homeRoutes,
    submissionManagementRoutes,
    submissionRoutes,
    thriveRoutes,
    timelineWallRoutes,
} from './pages'

const CommunityApp: LazyLoadedComponent = lazyLoad(() => import('./CommunityApp'))

export const toolTitle: string = ToolTitle.community

export const communityRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            ...challengeDetailRoutes,
            ...challengeListingRoutes,
            ...changelogRoutes,
            ...communityLoaderRoutes,
            ...homeRoutes,
            ...submissionRoutes,
            ...submissionManagementRoutes,
            ...timelineWallRoutes,
            ...thriveRoutes,
        ],
        domain: AppSubdomain.community,
        element: <CommunityApp />,
        id: toolTitle,
        layoutVariant: 'community',
        route: rootRoute,
        title: toolTitle,
    },
]
