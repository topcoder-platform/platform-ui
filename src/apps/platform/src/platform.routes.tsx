import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { learnRoutes } from '~/apps/learn'
import { devCenterRoutes } from '~/apps/dev-center'
import { gamificationAdminRoutes } from '~/apps/gamification-admin'
import { earnRoutes } from '~/apps/earn'
import { selfServiceRoutes } from '~/apps/self-service'

const Home: LazyLoadedComponent = lazyLoad(() => import('./routes/home'), 'HomePage')

const homeRoutes: ReadonlyArray<PlatformRoute> = [
    {
        element: <Home />,
        id: 'Home page',
        route: '',
    },
]

export const platformRoutes: Array<PlatformRoute> = [
    // NOTE: Order matters here bc the active tool
    // is determined by finding the first route
    // that matches the current path
    ...selfServiceRoutes,
    ...devCenterRoutes,
    ...earnRoutes,
    ...learnRoutes,
    ...gamificationAdminRoutes,
    ...homeRoutes,
]
