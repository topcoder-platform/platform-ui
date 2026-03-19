import { ChallengeMetadata } from '../models'

function normalizeMetadata(metadata: ChallengeMetadata[] | undefined): ChallengeMetadata[] {
    return Array.isArray(metadata)
        ? metadata
        : []
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
