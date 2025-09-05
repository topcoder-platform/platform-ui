import {
    useContext,
    useEffect,
    useMemo,
} from 'react'
import { find } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/libs/shared'

import {
    ChallengeDetailContextModel,
    ProjectResult,
    SubmissionInfo,
} from '../models'
import { fetchProjectResults } from '../services'
import { ChallengeDetailContext } from '../contexts'

export interface useFetchChallengeResultsProps {
    projectResults: ProjectResult[]
    isLoading: boolean
}

/**
 * Fetch challenge results
 * @param submissions list of submission info
 * @returns challenge results
 */
export function useFetchChallengeResults(
    submissions: SubmissionInfo[],
): useFetchChallengeResultsProps {
    // get challenge info from challenge detail context
    const {
        challengeInfo,
        resourceMemberIdMapping,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)

    // Use swr hooks for challenge results fetching
    const {
        data: projectResults,
        error,
        isValidating: isLoading,
    }: SWRResponse<ProjectResult[], Error> = useSWR<
        ProjectResult[],
        Error
    >(`reviewBaseUrl/projectResult/${challengeInfo?.legacyId}`, {
        fetcher: async () => {
            const results = await fetchProjectResults(1, 50, `${challengeInfo?.legacyId}`)
            return results.data
        },
        isPaused: () => !challengeInfo?.legacyId,
    })

    // Show backend error when fetching data fail
    useEffect(() => {
        if (error) {
            handleError(error)
        }
    }, [error])

    // add extra info into project results
    const results = useMemo(() => (projectResults ?? []).map(item => {
        const matchSubmission = find(submissions, { memberId: item.userId })
        return {
            ...item,
            // get review info from submissions
            reviews: matchSubmission
                ? matchSubmission.reviews ?? []
                : item.reviews,
            // get submission info from submissions
            submissionId: matchSubmission
                ? matchSubmission.id
                : item.submissionId,
            userInfo: resourceMemberIdMapping[item.userId],
        }
    }), [projectResults, resourceMemberIdMapping, submissions])

    return {
        isLoading,
        projectResults: results,
    }
}
