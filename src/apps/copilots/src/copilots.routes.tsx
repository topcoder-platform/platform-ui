import { lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'
import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'

const CopilotsApp: LazyLoadedComponent = lazyLoad(() => import('./CopilotsApp'))
const CopilotsRequestForm: LazyLoadedComponent = lazyLoad(() => import('./pages/copilot-request-form/index'))

export const rootRoute: string = (
    EnvironmentConfig.SUBDOMAIN === AppSubdomain.copilots ? '' : `/${AppSubdomain.copilots}`
)

export const toolTitle: string = ToolTitle.copilots
export const absoluteRootRoute: string = `${window.location.origin}${rootRoute}`

export const copilotsRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                element: <CopilotsRequestForm />,
                id: 'CopilotRequestForm',
                route: '/request',
            },

        ],
        domain: AppSubdomain.copilots,
        element: <CopilotsApp />,
        id: toolTitle,
        rolesRequired: [
            UserRole.administrator,
            UserRole.connectManager,
        ],
        route: rootRoute,
    },
]
