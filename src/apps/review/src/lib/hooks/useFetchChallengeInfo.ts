/**
 * Fetch challenge info
 */
import { useCallback, useState } from 'react'

import { useOnComponentDidMount } from '~/apps/admin/src/lib/hooks'

import {
    ChallengeInfo,
    ProjectResult,
    RegistrationInfo,
    Screening,
    SubmissionInfo,
} from '../models'
import {
    fetchChallengeInfo,
    fetchChallengeInfoById,
    fetchProjectResults,
    fetchRegistrations,
    fetchScreenings,
    fetchSubmissions,
} from '../services'

export interface useFetchChallengeInfoProps {
    challengeInfo: ChallengeInfo | undefined
    registrations: RegistrationInfo[]
    submissions: SubmissionInfo[]
    projectResults: ProjectResult[]
    screenings: Screening[]
}

/**
 * Fetch challenge info
 * @returns challenge info
 */
export function useFetchChallengeInfo(id?: string, role?: string): useFetchChallengeInfoProps {
    const [challengeInfo, setChallengeInfo] = useState<ChallengeInfo>()
    const [screenings, setScreenings] = useState<Screening[]>([])
    const [registrations, setRegistrations] = useState<RegistrationInfo[]>([])
    const [submissions, setSubmissions] = useState<SubmissionInfo[]>([])
    const [projectResults, setProjectResults] = useState<ProjectResult[]>([])
    const loadChallengeInfo = useCallback(() => {
        if (id) {
            fetchChallengeInfoById(id)
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

    const loadRegistrations = useCallback(() => {
        fetchRegistrations()
            .then(results => {
                setRegistrations(results)
            })
    }, [])

    const loadSubmissions = useCallback(() => {
        fetchSubmissions(role)
            .then(results => {
                setSubmissions(results)
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

    useOnComponentDidMount(() => {
        loadChallengeInfo()
        loadRegistrations()
        loadSubmissions()
        loadProjectResults()
        loadScreenings()
    })

    return {
        challengeInfo,
        projectResults,
        registrations,
        screenings,
        submissions,
    }
}
