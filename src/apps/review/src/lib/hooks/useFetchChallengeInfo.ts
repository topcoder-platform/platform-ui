/**
 * Fetch challenge info
 */
import { useCallback, useState } from 'react'

import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'

import {
    ChallengeInfo,
    ProjectResult,
    RegistrationInfo,
    SubmissionInfo,
} from '../models'
import {
    fetchChallengeInfo,
    fetchProjectResults,
    fetchRegistrations,
    fetchSubmissions,
} from '../services'

export interface useFetchChallengeInfoProps {
    challengeInfo: ChallengeInfo | undefined
    registrations: RegistrationInfo[]
    submissions: SubmissionInfo[]
    projectResults: ProjectResult[]
}

/**
 * Fetch challenge info
 * @returns challenge info
 */
export function useFetchChallengeInfo(): useFetchChallengeInfoProps {
    const [challengeInfo, setChallengeInfo] = useState<ChallengeInfo>()
    const [registrations, setRegistrations] = useState<RegistrationInfo[]>([])
    const [submissions, setSubmissions] = useState<SubmissionInfo[]>([])
    const [projectResults, setProjectResults] = useState<ProjectResult[]>([])
    const loadChallengeInfo = useCallback(() => {
        fetchChallengeInfo()
            .then(result => {
                setChallengeInfo(result)
            })
    }, [])

    const loadRegistrations = useCallback(() => {
        fetchRegistrations()
            .then(results => {
                setRegistrations(results)
            })
    }, [])

    const loadSubmissions = useCallback(() => {
        fetchSubmissions()
            .then(results => {
                setSubmissions(results)
            })
    }, [])

    const loadProjectResults = useCallback(() => {
        fetchProjectResults()
            .then(results => {
                setProjectResults(results)
            })
    }, [])

    useOnComponentDidMount(() => {
        loadChallengeInfo()
        loadRegistrations()
        loadSubmissions()
        loadProjectResults()
    })

    return {
        challengeInfo,
        projectResults,
        registrations,
        submissions,
    }
}
