/**
 * Route IDs and root path for the arena-manager app.
 */
import { AppSubdomain, EnvironmentConfig } from '~/config'

export const rootRoute: string
    = EnvironmentConfig.SUBDOMAIN === AppSubdomain.arenaManager
        ? ''
        : `/${AppSubdomain.arenaManager}`

export const problemLibraryRouteId = 'problem-library'
export const tournamentsRouteId = 'tournaments'
export const tournamentLaunchRouteId = 'tournament-launch'
export const aiHubTournamentRoute = '/ai-hub/tournament'

export function getTournamentLaunchPath(tourneyId: string): string {
    return `${rootRoute}/${tournamentsRouteId}/${tourneyId}/launch`
}

export function getActiveTournamentPath(): string {
    return aiHubTournamentRoute
}
