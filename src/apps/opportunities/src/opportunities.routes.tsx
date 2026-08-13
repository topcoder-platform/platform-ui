import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

const OpportunitiesApp: LazyLoadedComponent = lazyLoad(() => import('./OpportunitiesApp'))
const OpportunitiesPage: LazyLoadedComponent = lazyLoad(() => import('./pages/OpportunitiesPage'))
const ChallengeDetailsPage: LazyLoadedComponent = lazyLoad(() => import('./pages/ChallengeDetailsPage'))
const ReviewOpportunityDetailsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/ReviewOpportunityDetailsPage'),
)
const LegacyOpportunityRedirectPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/LegacyOpportunityRedirectPage'),
)

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.opportunities ? '' : `/${AppSubdomain.opportunities}`
)

export const toolTitle: string = ToolTitle.opportunities

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
