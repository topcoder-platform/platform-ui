import { ToolTitle } from '../../config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '../../lib'

const GigsHome: LazyLoadedComponent
    = lazyLoad(() => import('../../../src/routes/GigsPage'))

const GigsDetail: LazyLoadedComponent
    = lazyLoad(() => import('../../../src/routes/GigDetailsPage'))

const GigsApply: LazyLoadedComponent
    = lazyLoad(() => import('../../../src/routes/GigApplyPage'))

const MyGigs: LazyLoadedComponent
    = lazyLoad(() => import('../../../src/routes/MyGigsPage'))
    
const Gigs: LazyLoadedComponent = lazyLoad(() => import('./Gigs'))

export const toolTitle: string = ToolTitle.gigs

export const gigsRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            {
                element: <GigsHome />,
                route: 'gigs',
            },
            {
                element: <GigsDetail />,
                route: 'gigs/:externalId',
            },
            {
                element: <GigsApply />,
                route: 'gigs/:externalId/apply',
            },
            {
                element: <MyGigs />,
                route: 'my-gigs',
            },
        ],
        element: <Gigs />,
        id: toolTitle,
        route: '/earn',
    },
]
