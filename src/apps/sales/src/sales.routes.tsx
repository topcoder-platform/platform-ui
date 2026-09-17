import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'

const SalesPage: LazyLoadedComponent = lazyLoad(() => import('./SalesPage'))

/** Dedicated Sales host and combined-host route; the API independently verifies these roles. */
export const salesRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        domain: AppSubdomain.sales,
        element: <SalesPage />,
        id: ToolTitle.sales,
        rolesRequired: [UserRole.administrator, UserRole.talentManager],
        route: EnvironmentConfig.SUBDOMAIN === AppSubdomain.sales ? '' : '/sales',
        title: ToolTitle.sales,
    },
]
