/**
 * Mapping from challenge track (backend `track` field) to allowed
 * challenge type abbreviations (e.g. 'CH', 'F2F', 'TSK', 'MM').
 *
 * The values mirror the Work Manager behavior.
 */
const AllowedTypeAbbreviationsByTrack: Record<string, string[]> = {
    // Data Science
    DATA_SCIENCE: ['CH', 'F2F', 'TSK', 'MM'],
    // Design
    DESIGN: ['CH', 'F2F', 'TSK'],
    // Development
    DEVELOPMENT: ['CH', 'F2F', 'TSK', 'MM'],
    // Quality Assurance
    QUALITY_ASSURANCE: ['CH', 'F2F', 'TSK'],
}

export function getAllowedTypeAbbreviationsByTrack(track?: string): string[] | undefined {
    if (!track) return undefined
    return AllowedTypeAbbreviationsByTrack[track]
}
