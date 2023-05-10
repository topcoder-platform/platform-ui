import { Navigate } from 'react-router-dom'

import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'

const EarnAppRoot: LazyLoadedComponent = lazyLoad(() => import('./EarnApp'))

const ChallengeSubmissions: LazyLoadedComponent = lazyLoad(
    () => import('./routes/ChallengeSubmissions'),
    'ChallengeSubmissions',
)

const ChallengeDetails: LazyLoadedComponent = lazyLoad(
    () => import('./routes/ChallengeDetails'),
    'ChallengeDetails',
)

const ChallengeList: LazyLoadedComponent = lazyLoad(
    () => import('./routes/ChallengeList'),
    'ChallengeList',
)

const GigsHome: LazyLoadedComponent = lazyLoad(
    () => import('./routes/GigsPage'),
)

const GigsDetail: LazyLoadedComponent = lazyLoad(
    () => import('./routes/GigDetailsPage'),
)

const GigsApply: LazyLoadedComponent = lazyLoad(
    () => import('./routes/GigApplyPage'),
)

const MyGigs: LazyLoadedComponent = lazyLoad(
    () => import('./routes/MyGigsPage'),
)

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.earn ? '' : `/${AppSubdomain.earn}`
)

export const EARN_APP_PATHS: { [key: string]: string } = {
    root: rootRoute,
    gigs: `${rootRoute}/gigs`,
    challenges: `${rootRoute}/challenges`,
}

export const toolTitle: string = ToolTitle.earn
export const absoluteRootRoute: string = `${window.location.origin}${EARN_APP_PATHS.root}`

export const earnRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            {
                element: <Navigate to={EARN_APP_PATHS.challenges} />,
                route: '/',
            },
            {
                children: [],
                element: <ChallengeList />,
                id: 'Challenges Listing Page',
                route: 'challenges',
            },
            {
                children: [],
                element: <ChallengeDetails />,
                id: 'Challenge Details Page',
                route: 'challenges/:challengeId',
            },
            {
                children: [],
                element: <ChallengeSubmissions />,
                id: 'Challenges Submissions Page',
                route: 'challenges/:challengeId/*',
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
        domain: AppSubdomain.earn,
        element: <EarnAppRoot />,
        id: toolTitle,
        route: rootRoute,
    },
]
