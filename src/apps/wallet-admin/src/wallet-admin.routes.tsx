import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

const WalletApp: LazyLoadedComponent = lazyLoad(() => import('./WalletAdminApp'))
const WalletHomePage: LazyLoadedComponent = lazyLoad(
    () => import('./home'),
    'WalletHomePage',
)

// prettier-ignore
// eslint-disable-next-line max-len
export const rootRoute: string = EnvironmentConfig.SUBDOMAIN === AppSubdomain.walletAdmin ? '' : `/${AppSubdomain.walletAdmin}`

export const toolTitle = ToolTitle.walletAdmin
export const absoluteRootRoute: string = `${window.location.origin}/${rootRoute}`

export const walletAdminRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                children: [],
                element: <WalletHomePage />,
                id: 'Dashboard',
                route: '',
            },
        ],
        domain: AppSubdomain.walletAdmin,
        element: <WalletApp />,
        id: toolTitle,
        rolesRequired: ['Payment Admin'],
        route: rootRoute,
    },
]
