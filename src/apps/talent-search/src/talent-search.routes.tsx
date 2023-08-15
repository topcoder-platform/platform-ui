import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'

import './styles/main.vendor.scss'

const TalentSearchAppRoot: LazyLoadedComponent = lazyLoad(() => import('./TalentSearchApp'))
const SearchPage: LazyLoadedComponent = lazyLoad(() => import('./routes/search-page'), 'SearchPage')
const SearchResultsPage: LazyLoadedComponent = lazyLoad(
    () => import('./routes/search-results-page'),
    'SearchResultsPage',
)
const TalentPage: LazyLoadedComponent = lazyLoad(
    () => import('./routes/talent-page'),
    'TalentPage',
)
const MemberBadgesPage: LazyLoadedComponent = lazyLoad(
    () => import('@profiles/member-badges'),
    'MemberBadgesPage',
)

const isOnAppSubdomain = EnvironmentConfig.SUBDOMAIN === AppSubdomain.talentSearch
export const rootRoute: string = (
    isOnAppSubdomain ? '' : `/${AppSubdomain.talentSearch}`
)

export const TALENT_SEARCH_PATHS = {
    absoluteUrl: `//${AppSubdomain.talentSearch}.${EnvironmentConfig.TC_DOMAIN}`,
    results: `${rootRoute}/results`,
    root: rootRoute,
    talent: `${rootRoute}/talent`,
}

export const toolTitle: string = ToolTitle.talentSearch

const isAdminRestricted = EnvironmentConfig.RESTRICT_TALENT_SEARCH

export const talentSearchRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: isAdminRestricted,
        children: [
            {
                element: <SearchPage />,
                route: '/',
            },
            {
                element: <SearchResultsPage />,
                route: '/results',
            },
            {
                element: <TalentPage />,
                route: '/talent/:memberHandle',
            },
            {
                element: <MemberBadgesPage />,
                id: 'MemberBadgesPage',
                route: '/talent/:memberHandle/badges',
            },
        ],
        domain: AppSubdomain.talentSearch,
        element: <TalentSearchAppRoot />,
        id: toolTitle,
        rolesRequired: isAdminRestricted ? [
            UserRole.administrator,
        ] : undefined,
        route: rootRoute,
    },
]
