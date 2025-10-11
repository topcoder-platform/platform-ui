import { SubmissionInfo } from '../models'

export interface SubmissionHistoryPartition {
    latestSubmissions: SubmissionInfo[]
    latestSubmissionIds: Set<string>
    historyByMember: Map<string, SubmissionInfo[]>
}

export function getSubmissionHistoryKey(
    memberId: string | undefined,
    submissionId: string,
): string {
    if (memberId && memberId.length) {
        return memberId
    }

    return `__unknown__::${submissionId}`
}

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

export function partitionSubmissionHistory(
    submissions: SubmissionInfo[],
    allSubmissions?: SubmissionInfo[],
): SubmissionHistoryPartition {
    const byMember = new Map<string, SubmissionInfo[]>()
    const addEntry = (submission: SubmissionInfo | undefined): void => {
        if (!submission || !submission.id) {
            return
        }

        const memberKey = getSubmissionHistoryKey(
            submission.memberId,
            submission.id,
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
    const primaryIds = new Set(primarySubmissions.map(entry => entry.id))

    byMember.forEach((entries, memberKey) => {
        const sorted = entries
            .slice()
            .sort((a, b) => getSubmissionTimestamp(b) - getSubmissionTimestamp(a))

        const flaggedLatest = sorted.filter(entry => entry.isLatest)
        const latestEntry = flaggedLatest.length > 0 ? flaggedLatest[0] : sorted[0]

        if (latestEntry?.id) {
            const latestId = latestEntry.id
            const matchingPrimary = primarySubmissions.filter(entry => entry.id === latestId)
            if (matchingPrimary.length > 0) {
                matchingPrimary.forEach(entry => {
                    latestSubmissions.push(entry)
                })
            } else {
                latestSubmissions.push(latestEntry)
            }

            latestSubmissionIds.add(latestId)
        } else if (latestEntry) {
            latestSubmissions.push(latestEntry)
        }

        const historyEntries = sorted.filter(entry => entry.id !== latestEntry?.id)
        if (historyEntries.length > 0) {
            const seenIds = new Set<string>()
            const uniqueHistory = historyEntries.filter(entry => {
                const key = entry.id
                if (!key) {
                    return false
                }

                if (primaryIds.has(key) && latestSubmissionIds.has(key)) {
                    return false
                }

                if (seenIds.has(key)) {
                    return false
                }

                seenIds.add(key)
                return true
            })

            if (uniqueHistory.length > 0) {
                historyByMember.set(memberKey, uniqueHistory)
            }
        }
    })

    return {
        historyByMember,
        latestSubmissionIds,
        latestSubmissions,
    }
}
