import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

const AccountsApp: LazyLoadedComponent = lazyLoad(() => import('./AccountsApp'))
const AccountSettingsPage: LazyLoadedComponent = lazyLoad(() => import('./settings'), 'AccountSettingsPage')
const ChangeEmailVerificationPage: LazyLoadedComponent = lazyLoad(
    () => import('./settings/change-email-verification'),
    'ChangeEmailVerificationPage',
)

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.accounts ? '' : `/${AppSubdomain.accounts}`
)

export const toolTitle: string = ToolTitle.accounts
export const absoluteRootRoute: string = `${window.location.origin}${rootRoute}`

export const accountsRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            {
                authRequired: true,
                children: [],
                element: <AccountSettingsPage />,
                id: 'Account Settings',
                route: '',
            },
            {
                children: [],
                element: <ChangeEmailVerificationPage />,
                id: 'Change Email Verification',
                route: 'email-change/verify',
            },
            {
                children: [],
                element: <ChangeEmailVerificationPage />,
                id: 'Legacy Change Email Verification',
                route: 'changeEmail',
            },
        ],
        domain: AppSubdomain.accounts,
        element: <AccountsApp />,
        id: toolTitle,
        route: rootRoute,
    },
]
