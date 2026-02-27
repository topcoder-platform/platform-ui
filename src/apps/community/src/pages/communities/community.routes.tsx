import { FC, useEffect } from 'react'

import { PlatformRoute } from '~/libs/core'
import { LoadingSpinner } from '~/libs/ui'

import {
    type ExplicitCommunityId,
    explicitCommunityIds,
} from '../../config/community-id.config'
import {
    challengeDetailRouteId,
    challengeListingRouteId,
    communityLoaderRouteId,
    submissionManagementRouteId,
    submissionRouteId,
} from '../../config/routes.config'
import { ChallengeDetail } from '../challenge-detail'
import { ChallengeListing } from '../challenge-listing'
import SubmissionManagementPage from '../submission-management/SubmissionManagementPage'
import SubmissionPage from '../submission/SubmissionPage'

import { CommunityContentPage } from './CommunityContentPage'
import { CommunityLeaderboardPage } from './CommunityLeaderboardPage'
import { CommunityLoader } from './CommunityLoader'

interface ExternalRedirectProps {
    to: string
}

/**
 * Performs a hard browser redirect to an external URL.
 *
 * @param props Destination URL.
 * @returns Loading spinner shown during redirect.
 */
const ExternalRedirect: FC<ExternalRedirectProps> = (props: ExternalRedirectProps) => {
    useEffect(() => {
        window.location.replace(props.to)
    }, [props.to])

    return <LoadingSpinner />
}

const TCO_ARCHIVE_URL = 'https://archive.topcoder.com/TCO/index.html'
const TCO_COMMUNITY_IDS = Array.from(
    { length: 23 },
    (_, index) => `tco${String(index + 1)
        .padStart(2, '0')}`,
)
const GENERIC_CONTENT_ROUTES: ReadonlyArray<string> = [
    'learn',
    'get-started',
    'about',
    'assets',
    'bsic-incubator',
    'ibm-cloud',
    'resources',
    'catalog',
    'faq',
]
const STATIC_COMMUNITY_CONTENT_ROUTES: Readonly<Record<ExplicitCommunityId, ReadonlyArray<string>>> = {
    blockchain: ['learn', 'bsic-incubator'],
    cognitive: ['get-started', 'ibm-cloud', 'resources'],
    community2: ['learn'],
    cs: ['learn', 'catalog', 'faq'],
    demoexpert: ['learn'],
    iot: ['get-started', 'about', 'assets'],
    mobile: [],
    qa: ['learn'],
    srmx: ['learn'],
    taskforce: [],
    tcproddev: ['learn'],
    veterans: ['learn'],
    wipro: [],
}

const tcoRedirectRoutes: ReadonlyArray<PlatformRoute> = TCO_COMMUNITY_IDS.map(communityId => ({
    element: (
        <ExternalRedirect to={TCO_ARCHIVE_URL} />
    ),
    route: `${communityLoaderRouteId}/${communityId}`,
}))

/**
 * Generates a unique route id for static community loader routes.
 *
 * @param communityId Community identifier.
 * @returns Route id used for looking up child routes.
 */
function getStaticCommunityRouteId(communityId: string): string {
    return `${communityLoaderRouteId}-${communityId}`
}

/**
 * Builds child routes for a community landing route.
 *
 * @param contentRoutes Additional content-page slugs for the community.
 * @returns Child route list.
 */
function createCommunityChildRoutes(contentRoutes: ReadonlyArray<string>): Array<PlatformRoute> {
    const normalizedContentRoutes = Array.from(
        new Set(
            contentRoutes
                .map(route => route.trim())
                .filter(Boolean)
                .filter(route => route !== 'home' && route !== 'leaderboard'),
        ),
    )

    return [
        {
            element: <CommunityContentPage />,
            route: '',
        },
        {
            element: <CommunityContentPage />,
            route: 'home',
        },
        {
            element: <CommunityLeaderboardPage />,
            route: 'leaderboard',
        },
        {
            authRequired: false,
            element: <ChallengeListing />,
            route: challengeListingRouteId,
        },
        {
            authRequired: false,
            element: <ChallengeDetail />,
            route: challengeDetailRouteId,
        },
        {
            authRequired: true,
            element: <SubmissionPage />,
            route: submissionRouteId,
        },
        {
            authRequired: true,
            element: <SubmissionManagementPage />,
            route: submissionManagementRouteId,
        },
        ...normalizedContentRoutes.map(route => ({
            element: <CommunityContentPage />,
            route,
        })),
    ]
}

/**
 * Creates a static community loader route at `__community__/{communityId}`.
 *
 * @param communityId Community identifier.
 * @returns Static route definition with shared child routes.
 */
function createStaticCommunityRoute(communityId: ExplicitCommunityId): PlatformRoute {
    const routeId = getStaticCommunityRouteId(communityId)

    return {
        children: createCommunityChildRoutes(STATIC_COMMUNITY_CONTENT_ROUTES[communityId]),
        element: (
            <CommunityLoader
                communityId={communityId}
                routeId={routeId}
            />
        ),
        id: routeId,
        route: `${communityLoaderRouteId}/${communityId}`,
    }
}

const staticCommunityRoutes: Array<PlatformRoute> = explicitCommunityIds
    .map(communityId => createStaticCommunityRoute(communityId))

/**
 * Community route tree mounted at `__community__/:communityId`.
 */
export const communityLoaderRoutes: ReadonlyArray<PlatformRoute> = [
    ...tcoRedirectRoutes,
    ...staticCommunityRoutes,
    {
        children: createCommunityChildRoutes(GENERIC_CONTENT_ROUTES),
        element: <CommunityLoader routeId={communityLoaderRouteId} />,
        id: communityLoaderRouteId,
        route: `${communityLoaderRouteId}/:communityId`,
    },
]
