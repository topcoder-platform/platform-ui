/**
 * Fetch mock challenge info
 */
import { useCallback, useEffect, useState } from 'react'

import {
    ChallengeInfo,
    SubmissionInfo,
} from '../models'
import {
    fetchChallengeInfo,
    fetchMockSubmissions,
    mockFetchChallengeInfoById,
} from '../services'

export interface useFetchMockChallengeInfoProps {
    challengeInfo: ChallengeInfo | undefined
    submissions: SubmissionInfo[]
}

/**
 * Fetch mock challenge info
 * @returns challenge info
 */
export function useFetchMockChallengeInfo(id?: string, role?: string): useFetchMockChallengeInfoProps {
    const [challengeInfo, setChallengeInfo] = useState<ChallengeInfo>()
    const [submissions, setSubmissions] = useState<SubmissionInfo[]>([])
    const loadChallengeInfo = useCallback(() => {
        if (id) {
            mockFetchChallengeInfoById(id)
                .then(result => {
                    setChallengeInfo(result)
                })
        } else {
            fetchChallengeInfo()
                .then(result => {
                    setChallengeInfo(result)
                })
        }
    }, [id])

    const loadSubmissions = useCallback(() => {
        fetchMockSubmissions(role)
            .then(results => {
                setSubmissions(results)
            })
    }, [role])

    useEffect(() => {
        loadChallengeInfo()
        loadSubmissions()
    }, [role])

    return {
        challengeInfo,
        submissions,
    }
}
