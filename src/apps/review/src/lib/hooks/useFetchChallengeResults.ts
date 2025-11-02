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
import { PAST_CHALLENGE_STATUSES } from '../utils/challengeStatus'
import {
    SUBMISSION_TYPE_CONTEST,
} from '../constants'

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

const toScorePrecision = (value: number): number => {
    const normalized = Number(value.toFixed(2))

    return Number.isNaN(normalized) ? value : normalized
}

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
    if (
        typeof aggregateScore === 'number'
        && Number.isFinite(aggregateScore)
    ) {
        return toScorePrecision(aggregateScore)
    }

    if (!reviews.length) {
        return 0
    }

    const totalScore = reviews.reduce(
        (total, current) => total + (current.score ?? 0),
        0,
    )
    const averageScore = totalScore / reviews.length

    return toScorePrecision(averageScore)
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
    const contestSubmissions = memberSubmissions.filter(
        submission => (submission.type ?? SUBMISSION_TYPE_CONTEST) === SUBMISSION_TYPE_CONTEST,
    )

    // Prefer contest submissions; fall back to everything so we still display something if data is inconsistent
    const submissionsToEvaluate = contestSubmissions.length
        ? contestSubmissions
        : memberSubmissions

    if (!submissionsToEvaluate.length) {
        return undefined
    }

    // Evaluate each submission's effective final score using available reviews
    type EvaluatedSubmission = {
        submission: SubmissionInfo
        orderedReviews: ReviewResult[]
        computedFinalScore: number
        computedInitialScore: number
    }

    const evaluated: EvaluatedSubmission[] = submissionsToEvaluate.map(submission => {
        const fallbackReviews = submission?.reviews ?? []
        const mappedReviews = reviewsBySubmissionId.get(submission.id) ?? fallbackReviews
        const orderedReviews = orderReviewsByCreatedDate(mappedReviews)
        const aggregateScoreCandidate = toFiniteNumber(submission?.aggregateScore)
        const finalScoreCandidate = aggregateScoreCandidate
            ?? toFiniteNumber(submission?.review?.finalScore)
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
        finalScore: best.computedFinalScore,
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
    const normalizedStatus = useMemo<string>(
        () => (challengeInfo?.status ?? '')
            .trim()
            .toUpperCase(),
        [challengeInfo?.status],
    )
    const isPastChallengeStatus = useMemo<boolean>(
        () => (normalizedStatus
            ? PAST_CHALLENGE_STATUSES.some(status => normalizedStatus.startsWith(status))
            : false),
        [normalizedStatus],
    )
    const submissionSource = useMemo<SubmissionInfo[]>(() => {
        if (isPastChallengeStatus && (challengeInfo?.submissions?.length ?? 0) > 0) {
            return challengeInfo?.submissions ?? submissions
        }

        return submissions
    }, [
        challengeInfo?.submissions,
        isPastChallengeStatus,
        submissions,
    ])

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
                submissions: submissionSource,
                winner,
            })

            if (projectResult) {
                accumulator.push(projectResult)
                return accumulator
            }

            return accumulator
        }, [])
    }, [
        challengeUuid,
        resourceMemberIdMapping,
        reviewsBySubmissionId,
        sortedWinners,
        submissionSource,
    ])

    return {
        isLoading: shouldFetchReviews ? isLoadingReviews : false,
        projectResults,
    }
}
