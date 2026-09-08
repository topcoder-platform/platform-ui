import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { AppSubdomain, ToolTitle } from '~/config'

const GigsApp: LazyLoadedComponent = lazyLoad(() => import('./GigsApp'))
const GigsPage: LazyLoadedComponent = lazyLoad(() => import('./pages/GigsPage'))
const GigDetailsPage: LazyLoadedComponent = lazyLoad(() => import('./pages/GigDetailsPage'))
const GigApplyPage: LazyLoadedComponent = lazyLoad(() => import('./pages/GigApplyPage'))

export const gigsRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            { element: <GigsPage />, id: 'Gigs listing', route: '', title: 'Gigs' },
            { element: <GigDetailsPage />, id: 'Gig details', route: ':slug', title: 'Gig details' },
            {
                element: <GigApplyPage />,
                id: 'Gig application',
                route: ':slug/apply',
                title: 'Apply to a gig',
            },
        ],
        domain: AppSubdomain.gigs,
        element: <GigsApp />,
        id: ToolTitle.gigs,
        route: '/gigs',
        title: ToolTitle.gigs,
    },
]
