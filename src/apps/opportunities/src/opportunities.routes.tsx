import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

const OpportunitiesApp: LazyLoadedComponent = lazyLoad(() => import('./OpportunitiesApp'))
const OpportunitiesPage: LazyLoadedComponent = lazyLoad(() => import('./pages/OpportunitiesPage'))
const ChallengeDetailsPage: LazyLoadedComponent = lazyLoad(() => import('./pages/ChallengeDetailsPage'))
const ReviewOpportunityDetailsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/ReviewOpportunityDetailsPage'),
)

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.opportunities ? '' : `/${AppSubdomain.opportunities}`
)

export const toolTitle: string = ToolTitle.opportunities

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
