import { getRoutesContainer, lazyLoad, LazyLoadedComponent } from '~/libs/core'

import { rootRoute, showcaseSearchRouteId } from '../../config/routes.config'

const ProjectShowcasePage: LazyLoadedComponent = lazyLoad(
    () => import('./ProjectShowcasePage'),
    'ProjectShowcasePage',
)

const ProjectShowcasePostPage: LazyLoadedComponent = lazyLoad(
    () => import('./ProjectShowcasePostPage'),
    'ProjectShowcasePostPage',
)

export const showcaseRootRoute = `${rootRoute}/${showcaseSearchRouteId}`

export const getPostRoute = (projectId: string, postId: string): string => (
    `${showcaseRootRoute}/${projectId}/post/${postId}`
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
            {
                authRequired: true,
                element: <ProjectShowcasePostPage />,
                id: 'project-showcase-post-page',
                route: ':projectId/post/:postId',
            },
        ]),
        id: 'project-showcase',
        route: 'showcase',
    },
]
