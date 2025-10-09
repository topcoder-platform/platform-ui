import {
    useContext,
    useEffect,
    useMemo,
} from 'react'
import { orderBy } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/libs/shared'
import { getRatingColor } from '~/libs/core'

import {
    adjustProjectResult,
    BackendResource,
    BackendReview,
    ChallengeDetailContextModel,
    ChallengeWinner,
    convertBackendReviewToReviewResult,
    ProjectResult,
    ReviewResult,
    SubmissionInfo,
} from '../models'
import { fetchChallengeReviews } from '../services'
import { ChallengeDetailContext } from '../contexts'

type ResourceMemberMapping = ChallengeDetailContextModel['resourceMemberIdMapping']

interface BuildProjectResultParams {
    challengeUuid: string
    memberMapping: ResourceMemberMapping
    reviewsBySubmissionId: Map<string, ReviewResult[]>
    submissions: SubmissionInfo[]
    winner: ChallengeWinner
}

interface ResolveUserInfoParams {
    challengeUuid: string
    memberId: string
    memberMapping: ResourceMemberMapping
    winner: ChallengeWinner
}

const toFiniteNumber = (value?: number | null): number | undefined => (
    typeof value === 'number' && Number.isFinite(value) ? value : undefined
)

const orderReviewsByCreatedDate = (reviews: ReviewResult[]): ReviewResult[] => orderBy(
    reviews,
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

const resolveUserInfo = ({
    challengeUuid,
    memberId,
    memberMapping,
    winner,
}: ResolveUserInfoParams): BackendResource | undefined => {
    const existing = memberMapping[memberId]

    if (existing) {
        return existing
    }

    if (!winner.handle) {
        return undefined
    }

    const maxRating = toFiniteNumber(winner.maxRating)

    return {
        challengeId: challengeUuid,
        created: '',
        createdBy: '',
        handleColor: typeof maxRating === 'number'
            ? getRatingColor(maxRating)
            : undefined,
        id: '',
        memberHandle: winner.handle,
        memberId,
        roleId: '',
    }
}

const computeFinalScore = (
    reviews: ReviewResult[],
    aggregateScore: number | undefined,
): number => {
    if (typeof aggregateScore === 'number') {
        return aggregateScore
    }

    if (!reviews.length) {
        return 0
    }

    const totalScore = reviews.reduce(
        (total, current) => total + (current.score ?? 0),
        0,
    )
    const averageScore = totalScore / reviews.length

    return Math.round(averageScore * 100) / 100
}

const buildProjectResult = ({
    challengeUuid,
    memberMapping,
    reviewsBySubmissionId,
    submissions,
    winner,
}: BuildProjectResultParams): ProjectResult | undefined => {
    const memberId = `${winner.userId}`

    // Find all submissions for this member
    const memberSubmissions = submissions.filter(s => s.memberId === memberId)

    if (!memberSubmissions.length) {
        return undefined
    }

    // Evaluate each submission's effective final score using available reviews
    type EvaluatedSubmission = {
        submission: SubmissionInfo
        orderedReviews: ReviewResult[]
        computedFinalScore: number
        computedInitialScore: number
    }

    const evaluated: EvaluatedSubmission[] = memberSubmissions.map(submission => {
        const fallbackReviews = submission?.reviews ?? []
        const mappedReviews = reviewsBySubmissionId.get(submission.id) ?? fallbackReviews
        const orderedReviews = orderReviewsByCreatedDate(mappedReviews)
        const finalScoreCandidate = toFiniteNumber(submission?.review?.finalScore)
        const computedFinalScore = computeFinalScore(orderedReviews, finalScoreCandidate)
        const initialScoreCandidate = toFiniteNumber(submission?.review?.initialScore)
        const computedInitialScore = initialScoreCandidate ?? computedFinalScore

        return {
            computedFinalScore,
            computedInitialScore,
            orderedReviews,
            submission,
        }
    })

    // Compute average of individual final scores across all submissions
    const averageFinalScoreAcrossSubmissions = evaluated.length
        ? Math.round(
            (
                evaluated.reduce((sum, item) => sum + item.computedFinalScore, 0)
                / evaluated.length
            ) * 100,
        ) / 100
        : 0

    // Pick the submission with the highest computed final score
    const best = evaluated.reduce((bestSoFar, current) => {
        if (!bestSoFar) {
            return current
        }

        if (current.computedFinalScore > bestSoFar.computedFinalScore) {
            return current
        }

        // Tie-breaker: prefer the one with the most recent review date
        if (current.computedFinalScore === bestSoFar.computedFinalScore) {
            const currentDate = current.orderedReviews[0]?.createdAt
                ? new Date(current.orderedReviews[0].createdAt)
                    .getTime()
                : 0
            const bestDate = bestSoFar.orderedReviews[0]?.createdAt
                ? new Date(bestSoFar.orderedReviews[0].createdAt)
                    .getTime()
                : 0
            if (currentDate > bestDate) {
                return current
            }
        }

        return bestSoFar
    }, undefined as EvaluatedSubmission | undefined)

    if (!best) {
        return undefined
    }

    const userInfo = resolveUserInfo({
        challengeUuid,
        memberId,
        memberMapping,
        winner,
    })

    return adjustProjectResult({
        challengeId: challengeUuid,
        createdAt: best.submission?.review?.createdAt
            ?? best.orderedReviews[0]?.createdAt
            ?? new Date(),
        finalScore: averageFinalScoreAcrossSubmissions,
        initialScore: best.computedInitialScore,
        placement: winner.placement,
        reviews: best.orderedReviews,
        submissionId: best.submission.id,
        submittedDate: best.submission?.submittedDate,
        userId: memberId,
        userInfo,
    })
}

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

    const winners = useMemo<ChallengeWinner[]>(() => {
        if (challengeInfo && Array.isArray(challengeInfo.winners)) {
            return challengeInfo.winners
        }

        return []
    }, [challengeInfo])
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
        shouldFetchReviews
            ? `reviewBaseUrl/challengeReviews/${challengeUuid}`
            : undefined,
        () => fetchChallengeReviews(challengeUuid),
    )

    // Show backend error when fetching data fail
    useEffect(() => {
        if (error) {
            handleError(error)
        }
    }, [error])

    const reviewsBySubmissionId = useMemo(() => {
        const result = new Map<string, ReviewResult[]>()
        const reviewList = challengeReviews ?? []

        reviewList.forEach(review => {
            const transformedReview = convertBackendReviewToReviewResult(review)
            const existing = result.get(review.submissionId) ?? []
            result.set(review.submissionId, [...existing, transformedReview])
        })

        return result
    }, [challengeReviews])

    const sortedWinners = useMemo(
        () => orderBy(winners, ['placement'], ['asc']),
        [winners],
    )

    const projectResults = useMemo(() => {
        if (!sortedWinners.length) {
            return []
        }

        return sortedWinners.reduce<ProjectResult[]>((accumulator, winner) => {
            const projectResult = buildProjectResult({
                challengeUuid,
                memberMapping: resourceMemberIdMapping,
                reviewsBySubmissionId,
                submissions,
                winner,
            })

            if (projectResult) {
                accumulator.push(projectResult)
            }

            return accumulator
        }, [])
    }, [
        challengeUuid,
        resourceMemberIdMapping,
        reviewsBySubmissionId,
        sortedWinners,
        submissions,
    ])

    return {
        isLoading: shouldFetchReviews ? isLoadingReviews : false,
        projectResults,
    }
}
