import {
    useContext,
    useEffect,
    useMemo,
} from 'react'
import { find, orderBy } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/libs/shared'
import { getRatingColor } from '~/libs/core'

import {
    BackendResource,
    ChallengeDetailContextModel,
    ChallengeWinner,
    ProjectResult,
    SubmissionInfo,
    adjustProjectResult,
    convertBackendReviewToReviewResult,
    ReviewResult,
    BackendReview,
} from '../models'
import { fetchChallengeReviews } from '../services'
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
        challengeId,
        challengeInfo,
        resourceMemberIdMapping,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)

    const winners: ChallengeWinner[] = Array.isArray(challengeInfo?.winners)
        ? challengeInfo?.winners ?? []
        : []
    const challengeUuid = challengeInfo?.id ?? challengeId ?? ''
    const shouldFetchReviews = Boolean(challengeUuid && winners.length)

    // Use swr hooks for challenge reviews fetching when winners are available
    const {
        data: challengeReviews,
        error,
        isValidating: isLoadingReviews,
    }: SWRResponse<BackendReview[], Error> = useSWR<
        BackendReview[],
        Error
    >(
        shouldFetchReviews ? `reviewBaseUrl/challengeReviews/${challengeUuid}` : null,
        () => fetchChallengeReviews(challengeUuid),
    )

    // Show backend error when fetching data fail
    useEffect(() => {
        if (error) {
            handleError(error)
        }
    }, [error])

    const projectResults = useMemo(() => {
        if (!winners.length) {
            return []
        }

        const reviewsBySubmissionId = new Map<string, ReviewResult[]>()
        const reviewList = challengeReviews ?? []
        reviewList.forEach(review => {
            const transformedReview = convertBackendReviewToReviewResult(review)
            const existing = reviewsBySubmissionId.get(review.submissionId) ?? []
            existing.push(transformedReview)
            reviewsBySubmissionId.set(review.submissionId, existing)
        })

        const sortedWinners = orderBy(winners, ['placement'], ['asc'])

        return sortedWinners.reduce<ProjectResult[]>((accumulator, winner) => {
            const memberId = `${winner.userId}`
            const submission = find(submissions, { memberId })
            const submissionId = submission?.id ?? ''

            if (!submissionId) {
                return accumulator
            }

            const fallbackReviews = submission?.reviews ?? []
            const mappedReviews = reviewsBySubmissionId.get(submissionId) ?? fallbackReviews
            const orderedReviews = orderBy(
                mappedReviews,
                review => {
                    if (review.createdAt instanceof Date) {
                        return review.createdAt.getTime()
                    }

                    if (typeof review.createdAt === 'string') {
                        const parsed = new Date(review.createdAt)
                        return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
                    }

                    return 0
                },
                ['asc'],
            )

            const aggregateFinalScore = submission?.review?.finalScore
            const finalScoreCandidate = typeof aggregateFinalScore === 'number'
                && Number.isFinite(aggregateFinalScore)
                ? aggregateFinalScore
                : undefined

            const computedFinalScore = finalScoreCandidate ?? (
                orderedReviews.length
                    ? Math.round(
                        (orderedReviews.reduce(
                            (total, current) => total + (current.score ?? 0),
                            0,
                        )
                        / orderedReviews.length)
                        * 100,
                    ) / 100
                    : 0
            )

            const initialScoreCandidate = submission?.review?.initialScore
            const computedInitialScore = typeof initialScoreCandidate === 'number'
                && Number.isFinite(initialScoreCandidate)
                ? initialScoreCandidate
                : computedFinalScore

            const userInfoFromResources = resourceMemberIdMapping[memberId]
            const userInfo: BackendResource | undefined = userInfoFromResources
                ?? (winner.handle
                    ? {
                        challengeId: challengeUuid,
                        created: '',
                        createdBy: '',
                        handleColor: winner.maxRating != null
                            ? getRatingColor(winner.maxRating)
                            : undefined,
                        id: '',
                        memberHandle: winner.handle,
                        memberId,
                        roleId: '',
                    }
                    : undefined)

            const projectResult = adjustProjectResult({
                challengeId: challengeUuid,
                createdAt: submission?.review?.createdAt
                    ?? orderedReviews[0]?.createdAt
                    ?? new Date(),
                finalScore: computedFinalScore,
                initialScore: computedInitialScore,
                placement: winner.placement,
                reviews: orderedReviews,
                submissionId,
                userId: memberId,
                userInfo,
            })

            if (projectResult) {
                accumulator.push(projectResult)
            }

            return accumulator
        }, [])
    }, [
        challengeReviews,
        challengeUuid,
        resourceMemberIdMapping,
        submissions,
        winners,
    ])

    return {
        isLoading: shouldFetchReviews ? isLoadingReviews : false,
        projectResults,
    }
}
