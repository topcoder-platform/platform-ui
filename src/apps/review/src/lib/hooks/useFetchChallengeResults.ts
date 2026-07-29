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
    ChallengeDetailContextModel,
    ChallengeWinner,
    convertBackendSubmissionToSubmissionInfo,
    ProjectResult,
    ReviewResult,
    SubmissionInfo,
} from '../models'
import {
    fetchAllProjectResults,
    fetchAllSubmissions,
} from '../services'
import { ChallengeDetailContext } from '../contexts/ChallengeDetailContext'
import { PAST_CHALLENGE_STATUSES } from '../utils/challengeStatus'
import { isContestSubmissionType } from '../constants'
import {
    buildChallengeResultSubmissionSource,
} from '../utils/challengeResultSubmissions'

type ResourceMemberMapping = ChallengeDetailContextModel['resourceMemberIdMapping']

interface BuildProjectResultParams {
    canonicalResult: ProjectResult
    challengeUuid: string
    memberMapping: ResourceMemberMapping
    submissions: SubmissionInfo[]
    winner: ChallengeWinner
}

interface BuildCanonicalChallengeResultsParams {
    canonicalResults: ProjectResult[]
    challengeUuid: string
    memberMapping: ResourceMemberMapping
    submissions: SubmissionInfo[]
    winners: ChallengeWinner[]
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

const normalizeIdentifier = (value: unknown): string | undefined => {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalized = `${value}`.trim()
    return normalized.length ? normalized : undefined
}

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

/**
 * Builds a stable lookup key for one final-placement winner or project-result row.
 *
 * @param userId member identifier from challenge winners or Review API project results.
 * @param placement final placement associated with the member.
 * @returns A normalized member-and-placement key, or undefined for incomplete/non-final data.
 * @throws Does not throw.
 */
function buildWinnerResultKey(
    userId: unknown,
    placement: unknown,
): string | undefined {
    const normalizedUserId = normalizeIdentifier(userId)
    const normalizedPlacement = typeof placement === 'number'
        ? placement
        : Number(placement)

    if (
        !normalizedUserId
        || !Number.isInteger(normalizedPlacement)
        || normalizedPlacement <= 0
    ) {
        return undefined
    }

    return `${normalizedUserId}:${normalizedPlacement}`
}

/**
 * Determines whether a challenge winner represents a final placement.
 *
 * Canonical winner types must be PLACEMENT. An absent type and contest-submission aliases are
 * accepted for legacy challenge records; checkpoint and all other typed winners are rejected.
 *
 * @param winner challenge winner supplied by the Challenge API.
 * @returns Whether the winner may be matched to a canonical final project result.
 * @throws Does not throw.
 */
function isFinalPlacementWinner(winner: ChallengeWinner): boolean {
    const normalizedType = normalizeIdentifier(winner.type)
        ?.toUpperCase()

    return !normalizedType
        || normalizedType === 'PLACEMENT'
        || isContestSubmissionType(winner.type)
}

/**
 * Enriches one canonical Review API result with display data from its exact local submission.
 *
 * The canonical result remains authoritative for submission identity, placement, and scores.
 * Local data may supply reviews and the submitted date only when its submission id exactly
 * matches the canonical id, which prevents a multi-submission winner's sibling submission from
 * replacing the downloadable winner.
 *
 * @param params canonical result, matching challenge winner, submissions, reviews, and members.
 * @returns The display-ready project result, or undefined when the canonical identity is invalid.
 * @throws Does not throw.
 */
const buildProjectResult = ({
    canonicalResult,
    challengeUuid,
    memberMapping,
    submissions,
    winner,
}: BuildProjectResultParams): ProjectResult | undefined => {
    const canonicalSubmissionId = normalizeIdentifier(canonicalResult.submissionId)
    const memberId = normalizeIdentifier(canonicalResult.userId)

    if (!canonicalSubmissionId || !memberId) {
        return undefined
    }

    const exactSubmission = submissions.find(
        submission => normalizeIdentifier(submission.id) === canonicalSubmissionId,
    )
    const fallbackReviews = exactSubmission?.reviews ?? canonicalResult.reviews ?? []
    const orderedReviews = orderReviewsByCreatedDate(fallbackReviews)

    const userInfo = resolveUserInfo({
        challengeUuid,
        memberId,
        memberMapping,
        winner,
    })

    return adjustProjectResult({
        ...canonicalResult,
        challengeId: normalizeIdentifier(canonicalResult.challengeId) ?? challengeUuid,
        reviews: orderedReviews,
        submissionId: canonicalSubmissionId,
        submittedDate: exactSubmission?.submittedDate ?? canonicalResult.submittedDate,
        userId: memberId,
        userInfo,
    })
}

/**
 * Builds Winners-tab rows from canonical Review API project results.
 *
 * Winners are matched by normalized member id plus final placement. A winner without a matching
 * canonical row, or a row without a usable submission id, is omitted. Explicitly typed winners
 * must be final PLACEMENT winners; missing and contest-submission types remain supported for
 * legacy challenges.
 *
 * @param params canonical results and local display-enrichment data for one challenge.
 * @returns Display-ready final-placement results ordered by placement.
 * @throws Does not throw.
 */
export function buildCanonicalChallengeResults({
    canonicalResults,
    challengeUuid,
    memberMapping,
    submissions,
    winners,
}: BuildCanonicalChallengeResultsParams): ProjectResult[] {
    const canonicalResultsByWinner = new Map<string, ProjectResult>()
    const consumedWinnerKeys = new Set<string>()

    canonicalResults.forEach(canonicalResult => {
        const key = buildWinnerResultKey(
            canonicalResult.userId,
            canonicalResult.placement,
        )

        if (
            !key
            || !normalizeIdentifier(canonicalResult.submissionId)
            || canonicalResultsByWinner.has(key)
        ) {
            return
        }

        canonicalResultsByWinner.set(key, canonicalResult)
    })

    return orderBy(winners, ['placement'], ['asc'])
        .reduce<ProjectResult[]>((results, winner) => {
            if (!isFinalPlacementWinner(winner)) {
                return results
            }

            const key = buildWinnerResultKey(winner.userId, winner.placement)
            const canonicalResult = key
                ? canonicalResultsByWinner.get(key)
                : undefined

            if (!key || !canonicalResult || consumedWinnerKeys.has(key)) {
                return results
            }

            consumedWinnerKeys.add(key)

            const projectResult = buildProjectResult({
                canonicalResult,
                challengeUuid,
                memberMapping,
                submissions,
                winner,
            })

            if (projectResult) {
                results.push(projectResult)
            }

            return results
        }, [])
}

export interface useFetchChallengeResultsProps {
    projectResults: ProjectResult[]
    isLoading: boolean
}

/**
 * Fetches canonical Winners-tab results and enriches them with local display data.
 *
 * The Review API project-result endpoint is authoritative for the winning submission id,
 * placement, and scores. Challenge submissions contribute display-only data for the exact
 * canonical submission. Loading remains active until both request streams settle. Challenge
 * reviews are deliberately not fetched because registered members without submissions may
 * download winners but are not authorized to inspect challenge review data.
 *
 * @param submissions submissions already available in the challenge detail view.
 * @returns Canonical display-ready project results and their combined loading state.
 * @throws Does not throw; request failures are passed to the shared error handler.
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
    const shouldFetchWinnerData = Boolean(challengeUuid && winners.length)
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
    const {
        data: canonicalProjectResults,
        error: projectResultsError,
        isValidating: isLoadingProjectResults,
    }: SWRResponse<ProjectResult[], Error> = useSWR<
        ProjectResult[],
        Error
    >(
        shouldFetchWinnerData
            ? `reviewBaseUrl/challengeProjectResults/${challengeUuid}`
            : undefined,
        () => fetchAllProjectResults(challengeUuid, 100),
    )
    const {
        data: winnerSubmissions,
        error: winnerSubmissionsError,
        isValidating: isLoadingWinnerSubmissions,
    }: SWRResponse<SubmissionInfo[], Error> = useSWR<
        SubmissionInfo[],
        Error
    >(
        shouldFetchWinnerData
            ? `reviewBaseUrl/challengeWinnerSubmissions/${challengeUuid}`
            : undefined,
        async () => {
            const allSubmissions = await fetchAllSubmissions(challengeUuid, 100)
            return allSubmissions.map(item => convertBackendSubmissionToSubmissionInfo(item))
        },
    )

    const submissionSource = useMemo<SubmissionInfo[]>(() => {
        const challengeSubmissions = isPastChallengeStatus
            ? (challengeInfo?.submissions ?? submissions)
            : submissions

        return buildChallengeResultSubmissionSource({
            challengeSubmissions,
            memberMapping: resourceMemberIdMapping,
            reviewSubmissions: submissions,
            winnerSubmissions,
        })
    }, [
        challengeInfo?.submissions,
        isPastChallengeStatus,
        resourceMemberIdMapping,
        submissions,
        winnerSubmissions,
    ])

    useEffect(() => {
        if (projectResultsError) {
            handleError(projectResultsError)
        }
    }, [projectResultsError])

    useEffect(() => {
        if (winnerSubmissionsError) {
            handleError(winnerSubmissionsError)
        }
    }, [winnerSubmissionsError])

    const projectResults = useMemo(
        () => buildCanonicalChallengeResults({
            canonicalResults: canonicalProjectResults ?? [],
            challengeUuid,
            memberMapping: resourceMemberIdMapping,
            submissions: submissionSource,
            winners,
        }),
        [
            canonicalProjectResults,
            challengeUuid,
            resourceMemberIdMapping,
            submissionSource,
            winners,
        ],
    )

    return {
        isLoading: shouldFetchWinnerData
            ? (
                isLoadingProjectResults
                || isLoadingWinnerSubmissions
            )
            : false,
        projectResults,
    }
}
