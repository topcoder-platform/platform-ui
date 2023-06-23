/* eslint-disable max-len */
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'

import './styles/main.vendor.scss'

const TalentSearchAppRoot: LazyLoadedComponent = lazyLoad(() => import('./TalentSearchApp'))
const TalentSearch: LazyLoadedComponent = lazyLoad(() => import('./routes/talent-search/TalentSearch'))

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.talentSearch ? '' : `/${AppSubdomain.talentSearch}`
)

export const toolTitle: string = ToolTitle.talentSearch

export const talentSearchRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                element: <TalentSearch />,
                route: '/',
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
