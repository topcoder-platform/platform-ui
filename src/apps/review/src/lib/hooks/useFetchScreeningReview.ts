import {
    useContext,
    useMemo,
} from 'react'
import { every, filter } from 'lodash'

import {
    BackendResource,
    ChallengeDetailContextModel,
    convertBackendSubmissionToScreening,
    convertBackendSubmissionToSubmissionInfo,
    Screening,
    SubmissionInfo,
} from '../models'
import { ChallengeDetailContext } from '../contexts'

import { useFetchChallengeSubmissions, useFetchChallengeSubmissionsProps } from './useFetchChallengeSubmissions'

export interface useFetchScreeningReviewProps {
    // screening data
    screening: Screening[]
    // review data
    review: SubmissionInfo[]
    isLoading: boolean
    reviewProgress: number
}

/**
 * Fetch screening and review data
 * @returns challenge screening and review data
 */
export function useFetchScreeningReview(): useFetchScreeningReviewProps {
    // get challenge info from challenge detail context
    const {
        challengeId,
        resourceMemberIdMapping,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)

    // fetch challenge submissions
    const { challengeSubmissions, isLoading }: useFetchChallengeSubmissionsProps
        = useFetchChallengeSubmissions(challengeId)

    // get screening data from challenge submissions
    const screening = useMemo(() => challengeSubmissions.map(item => {
        const result = convertBackendSubmissionToScreening(item)
        return {
            ...result,
            screener: result.screenerId
                ? resourceMemberIdMapping[result.screenerId]
                : ({
                    handleColor: '#2a2a2a',
                    memberHandle: 'Not assigned',
                } as BackendResource),
            userInfo: resourceMemberIdMapping[result.memberId],
        }
    }), [challengeSubmissions, resourceMemberIdMapping])

    // get review data from challenge submissions
    const review = useMemo(() => challengeSubmissions.map(item => {
        const result = convertBackendSubmissionToSubmissionInfo(item)
        return {
            ...result,
            userInfo: resourceMemberIdMapping[result.memberId],
        }
    }), [challengeSubmissions, resourceMemberIdMapping])

    // get review progress from challenge review
    const reviewProgress = useMemo(() => {
        if (!review.length) {
            return 0
        }

        const submittedReviewSubmissions = filter(review, item => {
            if (!item.reviews?.length) {
                return false
            }

            return every(item.reviews, reviewResult => !!reviewResult.score)
        })

        return Math.round(
            (submittedReviewSubmissions.length * 100) / review.length,
        )
    }, [review])

    return {
        isLoading,
        review,
        reviewProgress,
        screening,
    }
}
