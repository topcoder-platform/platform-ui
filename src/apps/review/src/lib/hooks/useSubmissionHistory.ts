import { useCallback, useMemo, useState } from 'react'

import type { SubmissionInfo } from '../models/SubmissionInfo.model'
import {
    getSubmissionHistoryKey,
    hasIsLatestFlag,
    partitionSubmissionHistory,
} from '../utils/submissionHistory'
import type { SubmissionHistoryPartition } from '../utils/submissionHistory'

interface UseSubmissionHistoryParams {
    datas: SubmissionInfo[]
    filteredAll: SubmissionInfo[]
    isSubmissionTab: boolean
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
 * Encapsulates submission history modal state and derived metadata for tables.
 */
export function useSubmissionHistory({
    datas,
    filteredAll,
    isSubmissionTab,
}: UseSubmissionHistoryParams): UseSubmissionHistoryResult {
    const submissionHistory = useMemo<SubmissionHistoryPartition>(
        () => partitionSubmissionHistory(datas, filteredAll),
        [datas, filteredAll],
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
            const key = getSubmissionHistoryKey(memberId, submissionId)
            const entries = historyByMember.get(key)
            if (!entries || entries.length === 0) {
                return
            }

            setHistoryKey(key)
        },
        [historyByMember],
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
