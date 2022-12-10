import { ToolTitle } from '../../config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '../../lib'

const Account: LazyLoadedComponent = lazyLoad(() => import('./account'), 'Account')
const Settings: LazyLoadedComponent = lazyLoad(() => import('./Settings'))

export const settingsRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                children: [],
                element: <Account />,
                route: '',
                title: ToolTitle.settings,
            },
        ],
        element: <Settings />,
        id: ToolTitle.settings,
        route: '/account',
    },
]
