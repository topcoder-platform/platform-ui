import { Navigate } from 'react-router-dom'

import { lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

import { skillsManagerRootRoute, skillsManagerRoutes as skillsManagerChildRoutes } from './skills-manager'

const SkillsManagerApp: LazyLoadedComponent = lazyLoad(() => import('./SkillsManagerApp'))

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.skillsManager ? '' : `/${AppSubdomain.skillsManager}`
)

export const toolTitle: string = ToolTitle.skillsManager
export const absoluteRootRoute: string = `${window.location.origin}${rootRoute}`

export const skillsManagerRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            ...skillsManagerChildRoutes,
            {
                element: <Navigate to={`${rootRoute}${skillsManagerRootRoute}`} />,
                id: 'Default SkillsManager Route',
                route: '',
            },
        ],
        domain: AppSubdomain.skillsManager,
        element: <SkillsManagerApp />,
        id: toolTitle,
        rolesRequired: [UserRole.administrator],
        route: rootRoute,
    },
]
