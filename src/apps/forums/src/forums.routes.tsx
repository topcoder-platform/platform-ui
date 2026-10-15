import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'

const ForumsPage: LazyLoadedComponent = lazyLoad(() => import('./ForumsPage'))
const ForumsApp: LazyLoadedComponent = lazyLoad(() => import('./ForumsApp'))
export const forumsRoot: string = EnvironmentConfig.SUBDOMAIN === AppSubdomain.forums ? '' : '/forums'

/** Path of the legacy archive index relative to the forums root (`/legacy` on the forums host). */
export const legacyForumsPath: string = `${forumsRoot}/legacy`

/** Public routes require no login; the API enforces visibility and every mutation.
 * A single domain root keeps all children available on the forums subdomain.
 * `legacy` renders the migrated Jive archive on its own index page.
 */
export const forumsRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            { element: <ForumsPage />, id: 'Public forums', route: '', title: ToolTitle.forums },
            { element: <ForumsPage legacy />, id: 'Legacy forums', route: 'legacy', title: ToolTitle.forums },
            { element: <ForumsPage />, id: 'Forum category', route: 'category/:categoryId', title: ToolTitle.forums },
            { element: <ForumsPage />, id: 'Forum thread', route: 'thread/:threadId', title: ToolTitle.forums },
        ],
        domain: AppSubdomain.forums,
        element: <ForumsApp />,
        id: ToolTitle.forums,
        route: forumsRoot,
        title: ToolTitle.forums,
    },
]
