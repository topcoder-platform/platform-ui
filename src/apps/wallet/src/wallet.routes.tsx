import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

const WalletApp: LazyLoadedComponent = lazyLoad(() => import('./WalletApp'))
const WalletHomePage: LazyLoadedComponent = lazyLoad(
    () => import('./home'),
    'WalletHomePage',
)

// prettier-ignore
export const rootRoute: string = EnvironmentConfig.SUBDOMAIN === AppSubdomain.wallet ? '' : `/${AppSubdomain.wallet}`

export const toolTitle = ToolTitle.wallet
export const absoluteRootRoute: string = `${window.location.origin}/${rootRoute}`

export const walletRoutes: ReadonlyArray<PlatformRoute> = [
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
        domain: AppSubdomain.wallet,
        element: <WalletApp />,
        id: toolTitle,
        route: rootRoute,
    },
]
