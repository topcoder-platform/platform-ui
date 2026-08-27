import {
    ChallengeMetadata,
    GiteaTeam,
} from '../models'

function normalizeMetadata(metadata: ChallengeMetadata[] | undefined): ChallengeMetadata[] {
    return Array.isArray(metadata)
        ? metadata
        : []
}

/**
 * Normalizes a single Gitea team entry read from metadata or from the editor form.
 *
 * Gitea addresses teams by numeric id, so entries without one - such as the
 * team names stored before the editor switched to a Gitea-backed typeahead -
 * cannot be synced and are dropped.
 *
 * @param team raw team entry.
 * @returns the team, or undefined when it carries no usable id or name.
 * @throws Does not throw.
 */
function normalizeGiteaTeam(team: unknown): GiteaTeam | undefined {
    if (typeof team !== 'object' || !team) {
        return undefined
    }

    const candidate = team as Partial<GiteaTeam>
    const id = typeof candidate.id === 'number'
        ? candidate.id
        : Number(candidate.id)
    const name = typeof candidate.name === 'string'
        ? candidate.name.trim()
        : ''
    const organization = typeof candidate.organization === 'string'
        ? candidate.organization.trim()
        : ''

    if (!Number.isInteger(id) || id <= 0 || !name) {
        return undefined
    }

    return {
        id,
        name,
        organization,
    }
}

/**
 * Normalizes and de-duplicates a list of Gitea teams, dropping unusable entries.
 *
 * @param teams raw teams coming from metadata or from the editor form.
 * @returns unique teams, by id, in their original order.
 * @throws Does not throw.
 */
export function normalizeGiteaTeams(teams: unknown): GiteaTeam[] {
    if (!Array.isArray(teams)) {
        return []
    }

    const seenTeamIds = new Set<number>()

    return teams
        .map(team => normalizeGiteaTeam(team))
        .filter((team): team is GiteaTeam => {
            if (!team || seenTeamIds.has(team.id)) {
                return false
            }

            seenTeamIds.add(team.id)
            return true
        })
}

export function getMetadataValue(
    metadata: ChallengeMetadata[] | undefined,
    name: string,
): string | undefined {
    const metadataEntry = normalizeMetadata(metadata)
        .find(entry => entry.name === name)

    if (!metadataEntry || metadataEntry.value === undefined || metadataEntry.value === null) {
        return undefined
    }

    return String(metadataEntry.value)
}

export function setMetadataValue(
    metadata: ChallengeMetadata[] | undefined,
    name: string,
    value: string,
): ChallengeMetadata[] {
    const metadataEntries = normalizeMetadata(metadata)
    const metadataEntryIndex = metadataEntries.findIndex(entry => entry.name === name)

    if (metadataEntryIndex < 0) {
        return [
            ...metadataEntries,
            {
                name,
                value,
            },
        ]
    }

    return metadataEntries.map((metadataEntry, index) => (index === metadataEntryIndex
        ? {
            ...metadataEntry,
            value,
        }
        : metadataEntry))
}

export function removeMetadataValue(
    metadata: ChallengeMetadata[] | undefined,
    name: string,
): ChallengeMetadata[] {
    return normalizeMetadata(metadata)
        .filter(metadataEntry => metadataEntry.name !== name)
}

export function metadataToBoolean(
    metadata: ChallengeMetadata[] | undefined,
    name: string,
): boolean {
    const value = getMetadataValue(metadata, name)

    return value === 'true'
}

export function booleanToMetadata(
    metadata: ChallengeMetadata[] | undefined,
    name: string,
    value: boolean,
): ChallengeMetadata[] {
    return setMetadataValue(
        metadata,
        name,
        value
            ? 'true'
            : 'false',
    )
}

/**
 * Reads the unique Gitea teams stored under a JSON challenge metadata entry.
 *
 * @param metadata challenge metadata entries.
 * @param name metadata key holding the Gitea configuration.
 * @returns the configured teams, or an empty array when unset or malformed.
 * @throws Does not throw; malformed values resolve to an empty array.
 */
export function metadataToGiteaTeams(
    metadata: ChallengeMetadata[] | undefined,
    name: string,
): GiteaTeam[] {
    const value = getMetadataValue(metadata, name)

    if (!value) {
        return []
    }

    let parsed: unknown

    try {
        parsed = JSON.parse(value)
    } catch {
        return []
    }

    const teams = (parsed as { teams?: unknown } | null)?.teams

    if (!Array.isArray(teams)) {
        return []
    }

    return normalizeGiteaTeams(teams)
}

/**
 * Serializes Gitea teams into a JSON challenge metadata entry.
 *
 * Both the id and the name are persisted: the review API syncs membership by
 * id, and the name keeps the stored value and its logs readable.
 *
 * The metadata entry is removed when no team is configured so that challenges
 * without Gitea automation carry no `gitea` metadata at all.
 *
 * @param metadata challenge metadata entries.
 * @param name metadata key holding the Gitea configuration.
 * @param teams teams selected in the editor.
 * @returns the updated metadata entries.
 * @throws Does not throw.
 */
export function giteaTeamsToMetadata(
    metadata: ChallengeMetadata[] | undefined,
    name: string,
    teams: GiteaTeam[] | undefined,
): ChallengeMetadata[] {
    const normalizedTeams = normalizeGiteaTeams(teams)

    if (!normalizedTeams.length) {
        return removeMetadataValue(metadata, name)
    }

    return setMetadataValue(
        metadata,
        name,
        JSON.stringify({ teams: normalizedTeams }),
    )
}
