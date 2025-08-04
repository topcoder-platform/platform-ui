/**
 * Fetch mock challenge info
 */
import { useCallback, useEffect, useState } from 'react'
import { maxBy } from 'lodash'

import {
    ChallengeInfo,
    ProjectResult,
    Screening,
    SubmissionInfo,
} from '../models'
import {
    fetchChallengeInfo,
    fetchProjectResults,
    fetchScreenings,
    fetchSubmissions,
    mockFetchChallengeInfoById,
} from '../services'

export interface useFetchMockChallengeInfoProps {
    firstSubmissions: SubmissionInfo | undefined
    challengeInfo: ChallengeInfo | undefined
    submissions: SubmissionInfo[]
    projectResults: ProjectResult[]
    screenings: Screening[]
}

/**
 * Fetch mock challenge info
 * @returns challenge info
 */
export function useFetchMockChallengeInfo(id?: string, role?: string): useFetchMockChallengeInfoProps {
    const [challengeInfo, setChallengeInfo] = useState<ChallengeInfo>()
    const [screenings, setScreenings] = useState<Screening[]>([])
    const [firstSubmissions, setFirstSubmissions] = useState<SubmissionInfo>()
    const [submissions, setSubmissions] = useState<SubmissionInfo[]>([])
    const [projectResults, setProjectResults] = useState<ProjectResult[]>([])
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
        fetchSubmissions(role)
            .then(results => {
                setSubmissions(results)
            })
        fetchSubmissions()
            .then(results => {
                setFirstSubmissions(maxBy(results, 'review.initialScore'))
            })
    }, [role])

    const loadProjectResults = useCallback(() => {
        fetchProjectResults()
            .then(results => {
                setProjectResults(results)
            })
    }, [])

    const loadScreenings = useCallback(() => {
        fetchScreenings()
            .then(results => {
                setScreenings(results)
            })
    }, [])

    useEffect(() => {
        loadChallengeInfo()
        loadProjectResults()
        loadScreenings()
        loadSubmissions()
    }, [role])

    return {
        challengeInfo,
        firstSubmissions,
        projectResults,
        screenings,
        submissions,
    }
}
