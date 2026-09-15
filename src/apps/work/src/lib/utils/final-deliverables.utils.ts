import { ChallengeEditorFormData } from '../models'

import { getMetadataValue, setMetadataValue } from './metadata.utils'

export const FILE_TYPES_METADATA_NAME = 'fileTypes'

/**
 * Normalizes a single final-deliverable label coming from either user input or saved metadata.
 *
 * @param value raw file-type value from the input or metadata payload.
 * @returns the trimmed file-type label, or `undefined` when the value is empty.
 * @throws Does not throw.
 */
export function normalizeFileTypeValue(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const normalizedValue = value.trim()

    return normalizedValue || undefined
}

/**
 * Parses the persisted `fileTypes` challenge metadata into a unique, display-ready list.
 *
 * @param value serialized challenge metadata entry for final deliverables.
 * @returns normalized file-type labels in the saved order, excluding empty or duplicate values.
 * @throws Does not throw; invalid JSON produces an empty list.
 */
export function parseFileTypesMetadata(value: string | undefined): string[] {
    if (!value) {
        return []
    }

    try {
        const parsedValue = JSON.parse(value) as unknown

        if (!Array.isArray(parsedValue)) {
            return []
        }

        const addedFileTypes = new Set<string>()

        return parsedValue
            .map(item => normalizeFileTypeValue(item))
            .filter((item): item is string => {
                if (!item) {
                    return false
                }

                const normalizedKey = item.toLowerCase()

                if (addedFileTypes.has(normalizedKey)) {
                    return false
                }

                addedFileTypes.add(normalizedKey)

                return true
            })
    } catch {
        return []
    }
}

/**
 * Includes a pending final-deliverable input in create and save payloads.
 *
 * @param formData editor values, including the unfinished file-type input.
 * @returns form values with a unique, trimmed file type in metadata and a cleared input.
 * @throws Does not throw; malformed saved metadata is treated as an empty list.
 */
export function commitPendingFinalDeliverable(formData: ChallengeEditorFormData): ChallengeEditorFormData {
    const value = normalizeFileTypeValue(formData.finalDeliverable)
    if (!value) return formData

    const fileTypes = parseFileTypesMetadata(getMetadataValue(formData.metadata, FILE_TYPES_METADATA_NAME))
    const isDuplicate = fileTypes.some(fileType => fileType.toLowerCase() === value.toLowerCase())

    return {
        ...formData,
        finalDeliverable: '',
        metadata: isDuplicate ? formData.metadata : setMetadataValue(
            formData.metadata,
            FILE_TYPES_METADATA_NAME,
            JSON.stringify([...fileTypes, value]),
        ),
    }
}
