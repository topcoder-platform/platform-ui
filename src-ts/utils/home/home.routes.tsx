import { lazyLoad, PlatformRoute } from '../../lib'

const Home = lazyLoad(() => import('./Home'));

export const homeRoute: string = ''

export const homeRoutes: Array<PlatformRoute> = [
    {
        element: <Home />,
        hidden: true,
        route: homeRoute,
        title: 'Home page',
    },
]
