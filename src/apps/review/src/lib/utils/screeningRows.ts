import type { Screening } from '../models'

export interface ScreeningRowsSelection {
    isRestrictedToLatest: boolean
    rows: Screening[]
}

export interface SelectVisibleScreeningRowsOptions {
    latestSubmissionIds: ReadonlySet<string>
    screeningRows: Screening[]
    submissionLimit?: number
}

/**
 * Select the Screening rows that should be displayed for a challenge.
 *
 * The Screening table uses this selection for both desktop and mobile views.
 * Finite challenges retain the latest configured number of submission IDs selected
 * independently per member and exact submission type. Unlimited challenges retain
 * every Screening row. This function performs no I/O and does not throw.
 *
 * @param options visibility inputs for the challenge and its submissions
 * @param options.latestSubmissionIds latest submission ids calculated per member
 * @param options.screeningRows Screening rows available for display
 * @param options.submissionLimit finite latest-submission count, or undefined for all
 * @returns the visible rows and whether submission history was collapsed
 */
export function selectVisibleScreeningRows({
    latestSubmissionIds,
    screeningRows,
    submissionLimit,
}: SelectVisibleScreeningRowsOptions): ScreeningRowsSelection {
    const isRestrictedToLatest = submissionLimit !== undefined

    return {
        isRestrictedToLatest,
        rows: isRestrictedToLatest
            ? screeningRows.filter(row => latestSubmissionIds.has(row.submissionId))
            : screeningRows,
    }
}
