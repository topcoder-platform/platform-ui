import { Navigate } from 'react-router-dom'

import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

import { DOCUSIGN_RETURN_ROUTE } from './utils/docusign-return.utils'
import { isTopgearCommunity, TOPGEAR_CHALLENGES_ROUTE } from './utils/topgear.utils'

const OpportunitiesApp: LazyLoadedComponent = lazyLoad(() => import('./OpportunitiesApp'))
const OpportunitiesPage: LazyLoadedComponent = lazyLoad(() => import('./pages/OpportunitiesPage'))
const HomePage: LazyLoadedComponent = lazyLoad(() => import('./pages/HomePage'))
const ChallengeDetailsPage: LazyLoadedComponent = lazyLoad(() => import('./pages/ChallengeDetailsPage'))
const ReviewOpportunityDetailsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/ReviewOpportunityDetailsPage'),
)
const LegacyOpportunityRedirectPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/LegacyOpportunityRedirectPage'),
)
const DocuSignReturnPage: LazyLoadedComponent = lazyLoad(() => import('./pages/DocuSignReturnPage'))

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.opportunities ? '' : `/${AppSubdomain.opportunities}`
)

export const toolTitle: string = ToolTitle.opportunities

/**
 * Community-app served TopGear (Wipro) members their challenge list from the
 * `topgear` host root, so that host lands on the Opportunities listing instead
 * of the Platform UI home page.
 */
export const topgearRoutes: ReadonlyArray<PlatformRoute> = (
    isTopgearCommunity() ? [
        {
            element: <Navigate replace to={TOPGEAR_CHALLENGES_ROUTE} />,
            id: 'TopGear root redirect',
            route: '',
            title: toolTitle,
        },
    ] : []
)

/** Replacement aliases for community-app challenge and review routes. */
export const legacyOpportunityRoutes: ReadonlyArray<PlatformRoute> = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.opportunities ? [] : [
        {
            element: <LegacyOpportunityRedirectPage list />,
            id: 'Legacy challenges list redirect',
            route: '/challenges',
            title: 'Opportunities',
        },
        {
            element: <LegacyOpportunityRedirectPage review />,
            id: 'Legacy review opportunity redirect',
            route: '/challenges/:challengeId/review-opportunities',
            title: 'Review Opportunity',
        },
        {
            element: <LegacyOpportunityRedirectPage />,
            id: 'Legacy challenge detail redirect',
            route: '/challenges/:challengeId',
            title: 'Competition',
        },
    ]
)

export const opportunitiesRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            {
                element: <OpportunitiesPage />,
                id: 'Opportunities list',
                route: '',
                title: 'Opportunities',
            },
            // Member home ported from community-app's `/home` dashboard. It must stay
            // ahead of the `:kind` category catch-all, and like community-app it sends
            // anonymous visitors to login with this page as the return URL.
            {
                authRequired: true,
                element: <HomePage />,
                id: 'Opportunities member home',
                route: 'home',
                title: 'Home',
            },
            {
                element: <ChallengeDetailsPage />,
                id: 'Opportunity challenge details',
                route: 'challenge/:challengeId',
                title: 'Competition',
            },
            {
                element: <ReviewOpportunityDetailsPage />,
                id: 'Review opportunity details',
                route: 'review/:reviewOpportunityId',
                title: 'Review Opportunity',
            },
            {
                element: <DocuSignReturnPage />,
                id: 'DocuSign return',
                route: DOCUSIGN_RETURN_ROUTE,
                title: 'Terms',
            },
            {
                element: <OpportunitiesPage />,
                id: 'Opportunity category',
                route: ':kind',
                title: 'Opportunities',
            },
        ],
        domain: AppSubdomain.opportunities,
        element: <OpportunitiesApp />,
        id: toolTitle,
        route: rootRoute,
        title: toolTitle,
    },
]
