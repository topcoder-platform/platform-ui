import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

import { WALLET_ADMIN_ALLOWED_ROLES } from './config/access.config'

const WalletAdminApp: LazyLoadedComponent = lazyLoad(() => import('./WalletAdminApp'))
const WalletHomePage: LazyLoadedComponent = lazyLoad(
    () => import('./home'),
    'WalletHomePage',
)
const RoleErrorPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/role-error/RoleErrorPage'),
)

export const roleErrorRouteId = 'role-error'

// eslint-disable-next-line max-len
export const rootRoute: string = EnvironmentConfig.SUBDOMAIN === AppSubdomain.walletAdmin ? '' : `/${AppSubdomain.walletAdmin}`

export const roleErrorRoute: string = `${rootRoute}/${roleErrorRouteId}`

export const toolTitle = ToolTitle.walletAdmin
export const absoluteRootRoute: string = `${window.location.origin}/${rootRoute}`

export const walletAdminRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                authRequired: true,
                element: <RoleErrorPage />,
                route: roleErrorRouteId,
                title: 'Role Error',
            },
            {
                children: [],
                element: <WalletHomePage />,
                id: 'Dashboard',
                route: '',
            },
        ],
        domain: AppSubdomain.walletAdmin,
        element: <WalletAdminApp />,
        id: toolTitle,
        roleErrorRoute,
        rolesRequired: [...WALLET_ADMIN_ALLOWED_ROLES],
        route: rootRoute,
    },
]
