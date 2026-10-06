import { Outlet } from 'react-router-dom'

import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'

const ForumsPage: LazyLoadedComponent = lazyLoad(() => import('./ForumsPage'))
export const forumsRoot: string = EnvironmentConfig.SUBDOMAIN === AppSubdomain.forums ? '' : '/forums'

/** Public routes require no login; the API enforces visibility and every mutation.
 * A single domain root keeps all children available on the forums subdomain.
 */
export const forumsRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            { element: <ForumsPage />, id: 'Public forums', route: '', title: ToolTitle.forums },
            { element: <ForumsPage />, id: 'Forum category', route: 'category/:categoryId', title: ToolTitle.forums },
            { element: <ForumsPage />, id: 'Forum thread', route: 'thread/:threadId', title: ToolTitle.forums },
        ],
        domain: AppSubdomain.forums,
        element: <Outlet />,
        id: ToolTitle.forums,
        route: forumsRoot,
        title: ToolTitle.forums,
    },
]
