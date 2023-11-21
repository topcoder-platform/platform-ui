import { lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

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
        ],
        domain: AppSubdomain.admin,
        element: <AdminApp />,
        id: toolTitle,
        rolesRequired: [UserRole.administrator],
        route: rootRoute,
    },
]
