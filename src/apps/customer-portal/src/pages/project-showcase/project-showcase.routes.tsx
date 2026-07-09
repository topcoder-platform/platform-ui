import { getRoutesContainer, lazyLoad, LazyLoadedComponent } from '~/libs/core'

import { rootRoute, showcaseSearchRouteId } from '../../config/routes.config'

const ProjectShowcasePage: LazyLoadedComponent = lazyLoad(
    () => import('./ProjectShowcasePage'),
    'ProjectShowcasePage',
)

export const showcaseRootRoute = `${rootRoute}/${showcaseSearchRouteId}`

export const getPostRoute = (postId: string): string => (
    `${showcaseRootRoute}/${postId}`
)

export const customerPortalProjectShowcaseRoutes = [
    {
        children: [
            {
                authRequired: true,
                element: <ProjectShowcasePage />,
                id: 'project-showcase-page',
                route: '',
            },
        ],
        element: getRoutesContainer([
            {
                authRequired: true,
                element: <ProjectShowcasePage />,
                id: 'project-showcase-page',
                route: '',
            },
        ]),
        id: 'project-showcase',
        route: 'showcase',
    },
]
