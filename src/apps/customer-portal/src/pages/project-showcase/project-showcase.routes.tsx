import { getRoutesContainer, lazyLoad, LazyLoadedComponent } from '~/libs/core'

const ProjectShowcasePage: LazyLoadedComponent = lazyLoad(
    () => import('./ProjectShowcasePage'),
    'ProjectShowcasePage',
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
