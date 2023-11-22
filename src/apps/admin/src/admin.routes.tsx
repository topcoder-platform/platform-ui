import { Navigate } from 'react-router-dom'

import { lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

import { skillsManagerRootRoute, skillsManagerRoutes } from './skills-manager'

const AdminApp: LazyLoadedComponent = lazyLoad(() => import('./AdminApp'))

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.admin ? '' : `/${AppSubdomain.admin}`
)

export const toolTitle: string = ToolTitle.admin
export const absoluteRootRoute: string = `${window.location.origin}${rootRoute}`

export const adminRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            ...skillsManagerRoutes,
            {
                element: <Navigate to={`${rootRoute}${skillsManagerRootRoute}`} />,
                id: 'Default Admin Route',
                route: '',
            },
        ],
        domain: AppSubdomain.admin,
        element: <AdminApp />,
        id: toolTitle,
        rolesRequired: [UserRole.administrator],
        route: rootRoute,
    },
]
