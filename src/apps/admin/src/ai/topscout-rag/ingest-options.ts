import { InputSelectOption } from '~/libs/ui'

/**
 * Track/type vocabularies for this page.
 *
 * These deliberately differ between the two panels, and the difference is not
 * cosmetic:
 *
 *  - **Ingest** filters reach the v6 Challenges API (bulk ingestion paginates
 *    `searchChallengesTool`), which resolves `tracks`/`types` against the
 *    `challengeTrack`/`challengeType` tables' **abbreviation** column. Sending
 *    "Development" there matches no row, so the filter silently widens to
 *    "every track" instead of erroring.
 *  - **Indexed Challenges** filters query stored chunk metadata, where
 *    ingestion recorded the track's full **name** (`toFreeFormName(challenge.track)`
 *    in challenge-ingestion-workflow.ts). Sending "Dev" there matches nothing.
 *
 * So: abbreviations going out to the search API, full names coming back from
 * the index. Do not "align" the two lists.
 */
export const BULK_TRACK_OPTIONS: InputSelectOption[] = [
    { label: 'Any track', value: '' },
    { label: 'Development', value: 'Dev' },
    { label: 'Design', value: 'Des' },
    { label: 'Data Science', value: 'DS' },
    { label: 'Quality Assurance', value: 'QA' },
]

/**
 * Challenge types are resolved by abbreviation too, but unlike tracks the
 * abbreviations here are unconfirmed — they are rows in `challengeType`, not
 * constants in any repo. These values are the type *names*; if bulk ingestion
 * ignores a type filter, this list is the first place to look.
 */
export const BULK_TYPE_OPTIONS: InputSelectOption[] = [
    { label: 'Any type', value: '' },
    { label: 'Challenge', value: 'Challenge' },
    { label: 'First2Finish', value: 'First2Finish' },
    { label: 'Marathon Match', value: 'Marathon Match' },
    { label: 'Task', value: 'Task' },
]

/** Mirrors the workflow's own default status set. */
export const BULK_STATUS_OPTIONS: InputSelectOption[] = [
    { label: 'Active + Completed', value: '' },
    { label: 'Active only', value: 'ACTIVE' },
    { label: 'Completed only', value: 'COMPLETED' },
]

/**
 * Indexed-challenge filters match stored metadata, so these carry the track's
 * full name — see the note on BULK_TRACK_OPTIONS.
 */
export const INDEXED_TRACK_OPTIONS: InputSelectOption[] = [
    { label: 'All tracks', value: '' },
    { label: 'Development', value: 'Development' },
    { label: 'Design', value: 'Design' },
    { label: 'Data Science', value: 'Data Science' },
    { label: 'Quality Assurance', value: 'Quality Assurance' },
]

export const INDEXED_TYPE_OPTIONS: InputSelectOption[] = [
    { label: 'All types', value: '' },
    { label: 'Challenge', value: 'Challenge' },
    { label: 'First2Finish', value: 'First2Finish' },
    { label: 'Marathon Match', value: 'Marathon Match' },
    { label: 'Task', value: 'Task' },
]
