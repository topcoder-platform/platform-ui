import { getRoutesContainer, lazyLoad, LazyLoadedComponent } from '~/libs/core'

import { assistantsRouteId, rootRoute, topScoutRouteId } from '../../config/routes.config'

const AssistantsPage: LazyLoadedComponent = lazyLoad(
    () => import('./AssistantsPage'),
    'AssistantsPage',
)

const TopScoutPage: LazyLoadedComponent = lazyLoad(
    () => import('./TopScoutPage'),
    'TopScoutPage',
)

export const assistantsRootRoute = `${rootRoute}/${assistantsRouteId}`

export const getTopScoutRoute = (): string => `${assistantsRootRoute}/${topScoutRouteId}`

export const assistantsChildRoutes = [
    {
        authRequired: true,
        element: <AssistantsPage />,
        id: 'assistants-page',
        route: '',
    },
    {
        authRequired: true,
        element: <TopScoutPage />,
        id: 'top-scout-page',
        route: topScoutRouteId,
    },
]

export const customerPortalAssistantsRoutes = [
    {
        children: [...assistantsChildRoutes],
        element: getRoutesContainer(assistantsChildRoutes),
        id: assistantsRouteId,
        route: assistantsRouteId,
    },
]
