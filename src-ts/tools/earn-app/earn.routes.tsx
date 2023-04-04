import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '../../lib'

import { toolTitle } from './EarnApp'

const EarnAppRoot: LazyLoadedComponent = lazyLoad(() => import('./EarnApp'))

const ChallengeSubmissions: LazyLoadedComponent = lazyLoad(
    () => import('../../../src/earn/routes/ChallengeSubmissions'),
    'ChallengeSubmissions',
)

const ChallengeDetails: LazyLoadedComponent = lazyLoad(
    () => import('../../../src/earn/routes/ChallengeDetails'),
    'ChallengeDetails',
)

const ChallengeList: LazyLoadedComponent = lazyLoad(
    () => import('../../../src/earn/routes/ChallengeList'),
    'ChallengeList',
)

const GigsHome: LazyLoadedComponent
    = lazyLoad(() => import('../../../src/routes/GigsPage'))

const GigsDetail: LazyLoadedComponent
    = lazyLoad(() => import('../../../src/routes/GigDetailsPage'))

const GigsApply: LazyLoadedComponent
    = lazyLoad(() => import('../../../src/routes/GigApplyPage'))

const MyGigs: LazyLoadedComponent
    = lazyLoad(() => import('../../../src/routes/MyGigsPage'))
    
export enum EARN_APP_PATHS {
    root = '/earn',
}

export const rootRoute: string = EARN_APP_PATHS.root
export const absoluteRootRoute: string = `${window.location.origin}${EARN_APP_PATHS.root}`

export const earnRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            {
                children: [],
                element: <ChallengeList />,
                id: 'Challenges Listing Page',
                route: 'find/challenges',
            },
            {
                children: [],
                element: <ChallengeDetails />,
                id: 'Challenge Details Page',
                route: 'find/challenges/:challengeId',
            },
            {
                children: [],
                element: <ChallengeSubmissions />,
                id: 'Challenges Submissions Page',
                route: 'find/challenges/:challengeId/*',
            },
            {
                children: [],
                element: <GigsHome />,
                id: 'Gigs Listing Page',
                route: 'gigs',
            },
            {
                children: [],
                element: <GigsDetail />,
                id: 'Gigs Detail Page',
                route: 'gigs/:externalId',
            },
            {
                children: [],
                element: <GigsApply />,
                id: 'Gigs Apply Page',
                route: 'gigs/:externalId/apply',
            },
            {
                children: [],
                element: <MyGigs />,
                id: 'My Gigs Page',
                route: 'my-gigs',
            },
        ],
        element: <EarnAppRoot />,
        id: toolTitle,
        route: rootRoute,
    },
]
