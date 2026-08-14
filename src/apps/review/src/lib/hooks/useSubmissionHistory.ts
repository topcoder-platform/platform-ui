import { useCallback, useMemo, useState } from 'react'

import type { SubmissionInfo } from '../models/SubmissionInfo.model'
import {
    getSubmissionHistoryKey,
    hasIsLatestFlag,
    partitionSubmissionHistory,
} from '../utils/submissionHistory'
import type { SubmissionHistoryPartition } from '../utils/submissionHistory'

interface UseSubmissionHistoryParams {
    /** Primary table submissions, including review or screening details. */
    datas: SubmissionInfo[]
    /** Complete matching challenge history used to rank submissions. */
    filteredAll: SubmissionInfo[]
    /** Whether the consuming table supports submission-history actions. */
    isSubmissionTab: boolean
    /** Positive latest-submission count per member/type group. Defaults to one. */
    maxVisibleSubmissions?: number
}

export interface UseSubmissionHistoryResult {
    closeHistoryModal: () => void
    historyByMember: Map<string, SubmissionInfo[]>
    historyEntriesForModal: SubmissionInfo[]
    historyKey: string | undefined
    latestSubmissionIds: Set<string>
    latestSubmissions: SubmissionInfo[]
    openHistoryModal: (memberId: string | undefined, submissionId: string) => void
    shouldShowHistoryActions: boolean
}

/**
 * Encapsulate submission-history ranking and modal state for Review tables.
 *
 * @param params - Primary rows, complete matching history, table mode, and visible count.
 * @returns Latest selected rows and IDs, older member/type history, and modal callbacks.
 * @throws Does not throw; invalid visible counts are normalized by the partition utility.
 */
export function useSubmissionHistory({
    datas,
    filteredAll,
    isSubmissionTab,
    maxVisibleSubmissions,
}: UseSubmissionHistoryParams): UseSubmissionHistoryResult {
    const submissionHistory = useMemo<SubmissionHistoryPartition>(
        () => partitionSubmissionHistory(datas, filteredAll, {
            visibleSubmissionCount: maxVisibleSubmissions,
        }),
        [datas, filteredAll, maxVisibleSubmissions],
    )

    const {
        latestSubmissions,
        latestSubmissionIds,
        historyByMember,
    }: SubmissionHistoryPartition = submissionHistory

    const shouldShowHistoryActions = useMemo<boolean>(
        () => isSubmissionTab && hasIsLatestFlag(datas),
        [datas, isSubmissionTab],
    )

    const [historyKey, setHistoryKey] = useState<string | undefined>(undefined)

    const historyEntriesForModal = useMemo<SubmissionInfo[]>(
        () => (historyKey ? historyByMember.get(historyKey) ?? [] : []),
        [historyByMember, historyKey],
    )

    const openHistoryModal: (memberId: string | undefined, submissionId: string) => void = useCallback(
        (memberId: string | undefined, submissionId: string): void => {
            const submissionType = datas.find(submission => submission.id === submissionId)?.type
                ?? filteredAll.find(submission => submission.id === submissionId)?.type
            const key = getSubmissionHistoryKey(memberId, submissionId, submissionType)
            const entries = historyByMember.get(key)
            if (!entries || entries.length === 0) {
                return
            }

            setHistoryKey(key)
        },
        [datas, filteredAll, historyByMember],
    )

    const closeHistoryModal = useCallback((): void => {
        setHistoryKey(undefined)
    }, [])

    return {
        closeHistoryModal,
        historyByMember,
        historyEntriesForModal,
        historyKey,
        latestSubmissionIds,
        latestSubmissions,
        openHistoryModal,
        shouldShowHistoryActions,
    }
}
