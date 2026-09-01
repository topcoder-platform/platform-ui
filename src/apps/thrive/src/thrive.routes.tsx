import { ToolTitle } from '~/config'
import type { LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { lazyLoad } from '~/libs/core'

import { THRIVE_ROOT_ROUTE } from './config'

const ThriveApp: LazyLoadedComponent = lazyLoad(() => import('./ThriveApp'))
const ThriveHomePage: LazyLoadedComponent = lazyLoad(() => import('./pages/home/ThriveHomePage'), 'ThriveHomePage')
const ThriveTracksPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/tracks/ThriveTracksPage'),
    'ThriveTracksPage',
)
const ThriveSearchPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/search/ThriveSearchPage'),
    'ThriveSearchPage',
)
const ThriveArticlePage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/article/ThriveArticlePage'),
    'ThriveArticlePage',
)

/** Tool title used by the platform router to resolve Thrive child routes. */
export const toolTitle: string = ToolTitle.thrive

/** Public Payload-backed Thrive route tree. */
export const thriveRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            {
                children: [],
                element: <ThriveHomePage />,
                id: 'Thrive home',
                route: '',
            },
            {
                children: [],
                element: <ThriveTracksPage />,
                id: 'Thrive tracks',
                route: 'tracks',
            },
            {
                children: [],
                element: <ThriveSearchPage />,
                id: 'Search Thrive',
                route: 'search',
            },
            {
                children: [],
                element: <ThriveArticlePage />,
                id: 'Thrive article',
                route: 'articles/:slug',
            },
        ],
        element: <ThriveApp />,
        id: toolTitle,
        route: THRIVE_ROOT_ROUTE,
        title: toolTitle,
    },
]
