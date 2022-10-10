import { ToolTitle } from '../../config'
import { lazyLoad, PlatformRoute } from '../../lib'

const Account = lazyLoad(() => import('./account'), 'Account');
const Settings = lazyLoad(() => import('./Settings'));

export const settingsRoutes: Array<PlatformRoute> = [
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
        route: '/account',
        title: ToolTitle.settings,
    },
]
