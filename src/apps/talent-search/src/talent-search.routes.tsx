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

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.talentSearch ? '' : `/${AppSubdomain.talentSearch}`
)

export const TALENT_SEARCH_PATHS = {
    results: `${rootRoute}/results`,
    root: rootRoute,
    talent: `${rootRoute}/talent`,
}

export const toolTitle: string = ToolTitle.talentSearch

export const talentSearchRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
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
        rolesRequired: [
            UserRole.administrator,
        ],
        route: rootRoute,
    },
]
