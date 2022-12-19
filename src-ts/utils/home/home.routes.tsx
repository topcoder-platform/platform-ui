import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '../../lib'

const Home: LazyLoadedComponent = lazyLoad(() => import('./Home'))

export const homeRoute: string = ''

export const homeRoutes: ReadonlyArray<PlatformRoute> = [
    {
        element: <Home />,
        hidden: true,
        id: 'Home page',
        route: homeRoute,
    },
]
