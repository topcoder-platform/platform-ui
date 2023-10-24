import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

const AccountsApp: LazyLoadedComponent = lazyLoad(() => import('./AccountsApp'))
const AccountSettingsPage: LazyLoadedComponent = lazyLoad(() => import('./settings'), 'AccountSettingsPage')

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.accounts ? '' : `/${AppSubdomain.accounts}`
)

export const toolTitle: string = ToolTitle.accounts
export const absoluteRootRoute: string = `${window.location.origin}${rootRoute}`

export const accountsRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                children: [],
                element: <AccountSettingsPage />,
                id: 'Account Settings',
                route: '',
            },
        ],
        domain: AppSubdomain.accounts,
        element: <AccountsApp />,
        id: toolTitle,
        route: rootRoute,
    },
]
