import { SubmissionInfo } from '../models'

export interface SubmissionHistoryPartition {
    /** Older submissions grouped by member and exact normalized submission type. */
    historyByMember: Map<string, SubmissionInfo[]>
    /** IDs of the latest configured number of submissions in every member/type group. */
    latestSubmissionIds: Set<string>
    /** Primary submission rows associated with the latest configured IDs. */
    latestSubmissions: SubmissionInfo[]
}

export interface PartitionSubmissionHistoryOptions {
    /** Positive number of submissions retained in each member/type group. Defaults to one. */
    visibleSubmissionCount?: number
}

/**
 * Normalize the submission type used to isolate contest and checkpoint history.
 *
 * @param submissionType - Submission type returned by the API.
 * @returns A stable normalized type key, including a fallback for missing types.
 * @throws Does not throw.
 */
function normalizeSubmissionHistoryType(submissionType?: string): string {
    const normalizedType = (submissionType ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')

    return normalizedType || '__unknown_type__'
}

/**
 * Build the lookup key used for one member's history of an exact submission type.
 *
 * @param memberId - Submission owner ID, when available.
 * @param submissionId - Submission ID used to isolate rows with no owner.
 * @param submissionType - Exact submission type, normalized for legacy spelling variants.
 * @returns A stable member/type history key.
 * @throws Does not throw.
 */
export function getSubmissionHistoryKey(
    memberId: string | undefined,
    submissionId: string,
    submissionType?: string,
): string {
    const memberKey = memberId && memberId.length
        ? memberId
        : `__unknown__::${submissionId}`

    return `${memberKey}::${normalizeSubmissionHistoryType(submissionType)}`
}

/**
 * Check whether any submission includes the API's explicit latest flag.
 *
 * @param submissions - Submission-like objects to inspect.
 * @returns True when at least one object includes an `isLatest` value.
 * @throws Does not throw.
 */
export function hasIsLatestFlag<T extends { isLatest?: boolean }>(submissions: T[]): boolean {
    return submissions.some(submission => submission.isLatest !== undefined)
}

/**
 * Resolve a submission timestamp for newest-first ordering.
 *
 * @param submission - Submission metadata containing raw or formatted dates.
 * @returns Milliseconds since epoch, or zero when neither date is valid.
 * @throws Does not throw; invalid dates fall back to zero.
 */
function getSubmissionTimestamp(submission: SubmissionInfo): number {
    const candidates: Array<Date | undefined> = []

    if (submission.submittedDate instanceof Date) {
        candidates.push(submission.submittedDate)
    } else if (typeof submission.submittedDate === 'string') {
        candidates.push(new Date(submission.submittedDate))
    }

    if (submission.submittedDateString) {
        candidates.push(new Date(submission.submittedDateString))
    }

    for (const candidate of candidates.filter(Boolean) as Date[]) {
        const time = candidate.getTime()
        if (!Number.isNaN(time)) {
            return time
        }
    }

    return 0
}

/**
 * Normalize the requested number of visible submissions per member/type group.
 *
 * @param visibleSubmissionCount - Raw configured visible count.
 * @returns A positive whole-number count, defaulting to one.
 * @throws Does not throw.
 */
function normalizeVisibleSubmissionCount(visibleSubmissionCount?: number): number {
    if (!Number.isFinite(visibleSubmissionCount) || Number(visibleSubmissionCount) <= 0) {
        return 1
    }

    return Math.max(1, Math.floor(Number(visibleSubmissionCount)))
}

/**
 * Partition submissions into the latest configured rows and older history.
 *
 * Submissions are ranked independently for every member and normalized submission type. Explicit
 * `isLatest` rows remain first for backward compatibility, followed by submission timestamp. A
 * duplicated submission ID from the primary and complete-history inputs consumes only one slot.
 * Only primary rows are returned for display, so ranking cannot reintroduce an ineligible history
 * entry or promote an older eligible submission into a newer entry's configured slot.
 *
 * @param submissions - Primary table submissions.
 * @param allSubmissions - Optional complete submission history used for ranking and history actions.
 * @param options - Partition options, including the visible count per member/type group.
 * @returns Latest submission rows and IDs plus older history grouped by member/type.
 * @throws Does not throw; invalid visible counts default to one.
 */
export function partitionSubmissionHistory(
    submissions: SubmissionInfo[],
    allSubmissions?: SubmissionInfo[],
    options: PartitionSubmissionHistoryOptions = {},
): SubmissionHistoryPartition {
    const byMember = new Map<string, SubmissionInfo[]>()
    const addEntry = (submission: SubmissionInfo | undefined): void => {
        if (!submission || !submission.id) {
            return
        }

        const memberKey = getSubmissionHistoryKey(
            submission.memberId,
            submission.id,
            submission.type,
        )
        const list = byMember.get(memberKey)
        if (list) {
            list.push(submission)
        } else {
            byMember.set(memberKey, [submission])
        }
    }

    const primarySubmissions = submissions || []
    const extraSubmissions = allSubmissions ?? []

    primarySubmissions.forEach(addEntry)
    extraSubmissions.forEach(addEntry)

    const latestSubmissions: SubmissionInfo[] = []
    const latestSubmissionIds = new Set<string>()
    const historyByMember = new Map<string, SubmissionInfo[]>()
    const visibleSubmissionCount = normalizeVisibleSubmissionCount(
        options.visibleSubmissionCount,
    )

    byMember.forEach((entries, memberKey) => {
        const sorted = entries
            .slice()
            .sort((a, b) => {
                const latestDifference = Number(Boolean(b.isLatest)) - Number(Boolean(a.isLatest))
                if (latestDifference !== 0) {
                    return latestDifference
                }

                return getSubmissionTimestamp(b) - getSubmissionTimestamp(a)
            })
        const seenSubmissionIds = new Set<string>()
        const uniqueSorted = sorted.filter(entry => {
            if (!entry.id || seenSubmissionIds.has(entry.id)) {
                return false
            }

            seenSubmissionIds.add(entry.id)
            return true
        })
        const visibleEntries = uniqueSorted.slice(0, visibleSubmissionCount)
        const visibleIdsForGroup = new Set(visibleEntries.map(entry => entry.id))

        visibleEntries.forEach(visibleEntry => {
            const latestId = visibleEntry.id
            const matchingPrimary = primarySubmissions.filter(entry => entry.id === latestId)
            matchingPrimary.forEach(entry => {
                latestSubmissions.push(entry)
            })

            latestSubmissionIds.add(latestId)
        })

        const historyEntries = uniqueSorted.filter(entry => !visibleIdsForGroup.has(entry.id))
        if (historyEntries.length > 0) {
            historyByMember.set(memberKey, historyEntries)
        }
    })

    return {
        historyByMember,
        latestSubmissionIds,
        latestSubmissions,
    }
}
