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

const isOnAppSubdomain = EnvironmentConfig.SUBDOMAIN === AppSubdomain.talentSearch
export const rootRoute: string = (
    isOnAppSubdomain ? '' : `/${AppSubdomain.talentSearch}`
)

const absoluteRootUrl = (() => {
    const subdomain = isOnAppSubdomain ? AppSubdomain.talentSearch : EnvironmentConfig.SUBDOMAIN
    return `//${subdomain}.${EnvironmentConfig.TC_DOMAIN}${rootRoute}`
})()

export const TALENT_SEARCH_PATHS = {
    absoluteRootUrl,
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
