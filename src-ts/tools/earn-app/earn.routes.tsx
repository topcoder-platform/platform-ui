import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '../../lib'

import { toolTitle } from './EarnApp'

const EarnAppRoot: LazyLoadedComponent = lazyLoad(() => import('./EarnApp'))

const ChallengeDetails: LazyLoadedComponent = lazyLoad(
    () => import('../../../src/earn/routes/ChallengeDetails'),
    'ChallengeDetails',
)

const ChallengeList: LazyLoadedComponent = lazyLoad(
    () => import('../../../src/earn/routes/ChallengeList'),
    'ChallengeList',
)

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
                id: 'Challenges Listing Page',
                route: 'find/challenges/:challengeId',
            },
        ],
        element: <EarnAppRoot />,
        id: toolTitle,
        route: rootRoute,
    },
]
