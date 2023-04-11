import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'

const Home: LazyLoadedComponent = lazyLoad(() => import('./routes/home'), 'HomePage')

export const platformRoute: string = ''

export const platformRoutes: ReadonlyArray<PlatformRoute> = [
    {
        element: <Home />,
        hidden: true,
        id: 'Home page',
        route: platformRoute,
    },
]
