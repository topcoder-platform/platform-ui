import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { GiteaTeam } from '../models'

const GITEA_TEAMS_API_URL = `${EnvironmentConfig.API.V6}/gitea/teams`

const DEFAULT_SEARCH_LIMIT = 20

function normalizeGiteaTeam(team: Partial<GiteaTeam> | undefined): GiteaTeam | undefined {
    const id = typeof team?.id === 'number'
        ? team.id
        : Number(team?.id)
    const name = typeof team?.name === 'string'
        ? team.name.trim()
        : ''
    const organization = typeof team?.organization === 'string'
        ? team.organization.trim()
        : ''

    if (!Number.isInteger(id) || id <= 0 || !name) {
        return undefined
    }

    return {
        description: typeof team?.description === 'string' && team.description.trim()
            ? team.description.trim()
            : undefined,
        id,
        name,
        organization,
    }
}

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        message?: string
        response?: {
            data?: {
                message?: string
            }
        }
    }

    return new Error(
        typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage,
    )
}

/**
 * Searches Gitea teams by name across every Gitea organization.
 *
 * @param term free text typed in the Gitea teams field.
 * @param limit maximum number of matches to request.
 * @returns the matching teams, each qualified by its organization.
 * @throws when the review API request fails.
 */
export async function searchGiteaTeams(
    term: string,
    limit: number = DEFAULT_SEARCH_LIMIT,
): Promise<GiteaTeam[]> {
    const normalizedTerm = term.trim()

    if (!normalizedTerm) {
        return []
    }

    const query = new URLSearchParams({
        limit: String(limit),
        q: normalizedTerm,
    })

    try {
        const response = await xhrGetAsync<unknown>(`${GITEA_TEAMS_API_URL}?${query.toString()}`)

        if (!Array.isArray(response)) {
            return []
        }

        return response
            .map(team => normalizeGiteaTeam(team as Partial<GiteaTeam>))
            .filter((team): team is GiteaTeam => !!team)
    } catch (error) {
        throw normalizeError(error, 'Failed to search Gitea teams')
    }
}
