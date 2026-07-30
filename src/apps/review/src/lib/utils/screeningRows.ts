import type { Screening, SubmissionInfo } from '../models'

import { hasIsLatestFlag } from './submissionHistory'

export interface ScreeningRowsSelection {
    isRestrictedToLatest: boolean
    rows: Screening[]
}

export interface SelectVisibleScreeningRowsOptions {
    hasSubmissionLimit: boolean
    latestSubmissionIds: ReadonlySet<string>
    screeningRows: Screening[]
    submissionInfos: Array<Pick<SubmissionInfo, 'isLatest'>>
}

/**
 * Select the Screening rows that should be displayed for a challenge.
 *
 * The Screening table uses this selection for both desktop and mobile views.
 * Limited challenges collapse submission history only when the API supplies
 * explicit `isLatest` flags. Unlimited challenges, or responses without those
 * flags, retain every Screening row. This function performs no I/O and does
 * not throw.
 *
 * @param options visibility inputs for the challenge and its submissions
 * @param options.hasSubmissionLimit whether the challenge limits submissions
 * @param options.latestSubmissionIds latest submission ids calculated per member
 * @param options.screeningRows Screening rows available for display
 * @param options.submissionInfos submission metadata containing optional latest flags
 * @returns the visible rows and whether submission history was collapsed
 */
export function selectVisibleScreeningRows({
    hasSubmissionLimit,
    latestSubmissionIds,
    screeningRows,
    submissionInfos,
}: SelectVisibleScreeningRowsOptions): ScreeningRowsSelection {
    const isRestrictedToLatest = hasSubmissionLimit
        && hasIsLatestFlag(submissionInfos)

    return {
        isRestrictedToLatest,
        rows: isRestrictedToLatest
            ? screeningRows.filter(row => latestSubmissionIds.has(row.submissionId))
            : screeningRows,
    }
}
