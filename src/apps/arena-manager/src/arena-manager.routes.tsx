import { AppSubdomain, ToolTitle } from '~/config'
import {
    lazyLoad,
    PlatformRoute,
    Rewrite,
} from '~/libs/core'

import {
    aiHubTournamentRoute,
    problemLibraryRouteId,
    rootRoute,
    tournamentLaunchRouteId,
    tournamentsRouteId,
} from './config/routes.config'
import ActiveTournamentAiHubPage from './tournaments/ActiveTournamentAiHubPage'

const ArenaManagerApp = lazyLoad(
    () => import('./ArenaManagerApp'),
)

const ProblemLibraryPage = lazyLoad(
    () => import('./problem-library/ProblemLibraryPage'),
    'ProblemLibraryPage',
)

const TournamentPage = lazyLoad(
    () => import('./tournaments'),
    'TournamentPage',
)

const TournamentLaunchPage = lazyLoad(
    () => import('./tournaments/TournamentLaunchPage'),
    'TournamentLaunchPage',
)

export const toolTitle: string = ToolTitle.arenaManager

export const arenaManagerRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: false,
        element: <ActiveTournamentAiHubPage />,
        id: 'ai-hub-tournament',
        route: aiHubTournamentRoute,
        title: 'Active Tournament',
    },
    {
        authRequired: true,
        // TODO: Restrict viewing of Arena Manager pages by role when role policy is finalized.
        // Example: rolesRequired: ['arena-admin']
        children: [
            {
                element: <Rewrite to={problemLibraryRouteId} />,
                route: '',
            },
            {
                element: <ProblemLibraryPage />,
                id: problemLibraryRouteId,
                route: problemLibraryRouteId,
                title: 'Problem Library',
            },
            {
                element: <TournamentPage />,
                id: tournamentsRouteId,
                route: tournamentsRouteId,
                title: 'Tournaments',
            },
            {
                element: <TournamentLaunchPage />,
                id: tournamentLaunchRouteId,
                route: `${tournamentsRouteId}/:tourneyId/launch`,
                title: 'Launch Tournament',
            },
        ],
        domain: AppSubdomain.arenaManager,
        element: <ArenaManagerApp />,
        id: toolTitle,
        route: rootRoute,
        title: toolTitle,
    },
]
