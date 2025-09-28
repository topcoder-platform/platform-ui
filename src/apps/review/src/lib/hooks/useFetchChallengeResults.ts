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
    const submission = find(submissions, { memberId })
    const submissionId = submission?.id

    if (!submissionId) {
        return undefined
    }

    const fallbackReviews = submission?.reviews ?? []
    const mappedReviews = reviewsBySubmissionId.get(submissionId) ?? fallbackReviews
    const orderedReviews = orderReviewsByCreatedDate(mappedReviews)
    const finalScoreCandidate = toFiniteNumber(submission?.review?.finalScore)
    const computedFinalScore = computeFinalScore(orderedReviews, finalScoreCandidate)
    const initialScoreCandidate = toFiniteNumber(submission?.review?.initialScore)
    const computedInitialScore = initialScoreCandidate ?? computedFinalScore
    const userInfo = resolveUserInfo({
        challengeUuid,
        memberId,
        memberMapping,
        winner,
    })

    return adjustProjectResult({
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
        if (Array.isArray(challengeInfo?.winners)) {
            return challengeInfo.winners
        }

        return []
    }, [challengeInfo?.winners])
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
