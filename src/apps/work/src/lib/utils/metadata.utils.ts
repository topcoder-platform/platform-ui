import { ChallengeMetadata } from '../models'

function normalizeMetadata(metadata: ChallengeMetadata[] | undefined): ChallengeMetadata[] {
    return Array.isArray(metadata)
        ? metadata
        : []
}

/**
 * Trims and de-duplicates a list of Gitea team ids, dropping empty entries.
 *
 * @param teams raw team ids coming from metadata or from the editor form.
 * @returns unique, trimmed, nonempty team ids in their original order.
 * @throws Does not throw.
 */
export function normalizeGiteaTeams(teams: unknown): string[] {
    if (!Array.isArray(teams)) {
        return []
    }

    const uniqueTeams = new Set(
        teams
            .map(team => (typeof team === 'string' || typeof team === 'number'
                ? String(team)
                    .trim()
                : ''))
            .filter(team => !!team),
    )

    return Array.from(uniqueTeams)
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
 * Reads the unique Gitea team ids stored under a JSON challenge metadata entry.
 *
 * @param metadata challenge metadata entries.
 * @param name metadata key holding the Gitea configuration.
 * @returns the configured team ids, or an empty array when unset or malformed.
 * @throws Does not throw; malformed values resolve to an empty array.
 */
export function metadataToGiteaTeams(
    metadata: ChallengeMetadata[] | undefined,
    name: string,
): string[] {
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
 * Serializes Gitea team ids into a JSON challenge metadata entry.
 *
 * The metadata entry is removed when no team is configured so that challenges
 * without Gitea automation carry no `gitea` metadata at all.
 *
 * @param metadata challenge metadata entries.
 * @param name metadata key holding the Gitea configuration.
 * @param teams team ids selected in the editor.
 * @returns the updated metadata entries.
 * @throws Does not throw.
 */
export function giteaTeamsToMetadata(
    metadata: ChallengeMetadata[] | undefined,
    name: string,
    teams: string[] | undefined,
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
