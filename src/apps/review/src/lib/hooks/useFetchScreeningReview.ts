import { every, filter, forEach } from 'lodash'
import { useContext, useEffect, useMemo } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { getRatingColor, xhrGetAsync } from '~/libs/core'
import { handleError } from '~/libs/shared'

import { DESIGN, REVIEWER, SUBMITTER } from '../../config/index.config'
import { ChallengeDetailContext, ReviewAppContext } from '../contexts'
import {
    BackendPhase,
    BackendResource,
    BackendReview,
    BackendSubmission,
    ChallengeDetailContextModel,
    convertBackendReviewToReviewInfo,
    convertBackendReviewToReviewResult,
    convertBackendSubmissionToScreening,
    convertBackendSubmissionToSubmissionInfo,
    createEmptyBackendReview,
    MappingReviewAppeal,
    ReviewAppContextModel,
    Screening,
    SubmissionInfo,
} from '../models'
import { fetchChallengeReviews } from '../services'

import { useFetchAppealQueue, useFetchAppealQueueProps } from './useFetchAppealQueue'
import { useFetchChallengeSubmissions, useFetchChallengeSubmissionsProps } from './useFetchChallengeSubmissions'
import { useRole, useRoleProps } from './useRole'

/**
 * DEBUG_CHECKPOINT_PHASES instrumentation coordinates verbose logging for checkpoint screening analysis.
 * Set `DEBUG_CHECKPOINT_PHASES=true` in the environment configuration to enable this diagnostic output.
 * When enabled the hook logs:
 * - Phase metadata resolution: scorecard ids, phase ids, and which data source satisfied the lookup.
 * - Review matching decisions: every invocation of `reviewMatchesPhase` with criterion-level outcomes.
 * - Checkpoint collection: detailed review-to-submission mappings for Screening and Review checkpoints.
 * - Cross-tab validation: overlaps or mismatches between checkpoint and checkpoint review datasets.
 * Use these logs to trace why a review appears on a specific tab and to spot substring collisions.
 * Known caveat: substring matching inside `reviewMatchesPhase` can miscategorize phases with similar names.
 */
const DEBUG_CHECKPOINT_PHASES = Boolean(
    (EnvironmentConfig as unknown as { DEBUG_CHECKPOINT_PHASES?: boolean }).DEBUG_CHECKPOINT_PHASES,
)

const LOG_PREFIX = '[useFetchScreeningReview]'
const MAX_DEBUG_METADATA_LENGTH = 200

function truncateForLog(value: string | undefined, maxLength: number = MAX_DEBUG_METADATA_LENGTH): string {
    if (!value) {
        return ''
    }

    if (value.length <= maxLength) {
        return value
    }

    return `${value.slice(0, maxLength)}...`
}

function debugLog(namespace: string, payload: unknown): void {
    if (!DEBUG_CHECKPOINT_PHASES) {
        return
    }

    console.debug(`${LOG_PREFIX} ${namespace}`, payload)
}

function warnLog(namespace: string, payload: unknown): void {
    if (!DEBUG_CHECKPOINT_PHASES) {
        return
    }

    console.warn(`${LOG_PREFIX} ${namespace}`, payload)
}

type ReviewerPhaseConfig = {
    scorecardId?: string
    phaseId?: string | number
    type?: string
}

type MetadataRecord = Record<string, unknown>

function parseFiniteNumber(value: unknown): number | undefined {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) {
            return undefined
        }

        const parsed = Number(trimmed)
        return Number.isFinite(parsed) ? parsed : undefined
    }

    return undefined
}

function parseReviewMetadataObject(metadata: BackendReview['metadata']): MetadataRecord | undefined {
    if (!metadata || metadata === null) {
        return undefined
    }

    if (typeof metadata === 'object') {
        return metadata as MetadataRecord
    }

    if (typeof metadata === 'string') {
        try {
            const parsed = JSON.parse(metadata)
            return typeof parsed === 'object' && parsed !== null
                ? parsed as MetadataRecord
                : undefined
        } catch {
            return undefined
        }
    }

    return undefined
}

function extractOutcomeFromMetadata(metadata: BackendReview['metadata']): Screening['result'] | undefined {
    const metadataObject = parseReviewMetadataObject(metadata)

    const normalize = (value: string): Screening['result'] | undefined => {
        const normalized = value.trim()
            .toLowerCase()
        if (!normalized) {
            return undefined
        }

        if (normalized === 'pass') {
            return 'PASS'
        }

        if (normalized === 'fail' || normalized === 'no pass' || normalized === 'no-pass' || normalized === 'nopass') {
            return 'NO PASS'
        }

        return undefined
    }

    if (metadataObject) {
        const candidates = ['outcome', 'result', 'status']
        for (const key of candidates) {
            const raw = metadataObject[key]
            if (typeof raw === 'string') {
                const parsed = normalize(raw)
                if (parsed) {
                    return parsed
                }
            }
        }

        return undefined
    }

    if (typeof metadata === 'string') {
        return normalize(metadata)
    }

    return undefined
}

type SubmissionLookupArgs = {
    review: BackendReview
    submissionsById: Map<string, BackendSubmission>
    submissionsByLegacyId: Map<string, BackendSubmission>
}

function resolveSubmissionForReview({
    review,
    submissionsById,
    submissionsByLegacyId,
}: SubmissionLookupArgs): BackendSubmission | undefined {
    if (review.submissionId) {
        const submission = submissionsById.get(review.submissionId)
        if (submission) {
            return submission
        }
    }

    if (review.legacySubmissionId) {
        const legacyKey = `${review.legacySubmissionId}`
        const submission = submissionsByLegacyId.get(legacyKey)
        if (submission) {
            return submission
        }
    }

    return undefined
}

type SubmissionIdResolutionArgs = {
    baseSubmissionInfo?: SubmissionInfo
    defaultId: string
    matchingSubmission?: BackendSubmission
    review: BackendReview
}

function resolveFallbackSubmissionId({
    baseSubmissionInfo,
    defaultId,
    matchingSubmission,
    review,
}: SubmissionIdResolutionArgs): string | undefined {
    return review.submissionId
        ?? baseSubmissionInfo?.id
        ?? (review.legacySubmissionId ? `${review.legacySubmissionId}` : undefined)
        ?? review.id
        ?? matchingSubmission?.id
        ?? defaultId
}

type SubmitterMemberIdResolutionArgs = {
    baseSubmissionInfo?: SubmissionInfo
    matchingSubmission?: BackendSubmission
}

function resolveSubmitterMemberId({
    baseSubmissionInfo,
    matchingSubmission,
}: SubmitterMemberIdResolutionArgs): string {
    return matchingSubmission?.memberId
        || baseSubmissionInfo?.memberId
        || ''
}

// Local helpers
function getNumericScore(review: BackendReview | undefined): number | undefined {
    if (!review) return undefined

    const finalScore = parseFiniteNumber(review.finalScore)
    if (finalScore !== undefined) return finalScore

    const initialScore = parseFiniteNumber(review.initialScore)
    if (initialScore !== undefined) return initialScore

    const metadataObject = parseReviewMetadataObject(review.metadata)
    if (metadataObject) {
        const metadataScoreKeys = ['score', 'aggregateScore', 'finalScore', 'initialScore', 'rawScore']
        for (const key of metadataScoreKeys) {
            const numeric = parseFiniteNumber(metadataObject[key])
            if (numeric !== undefined) {
                return numeric
            }
        }
    }

    return undefined
}

function parseSubmissionScore(score: string | null | undefined): number | undefined {
    if (score === null || score === undefined) {
        return undefined
    }

    const parsed = Number(score)
    return Number.isFinite(parsed) ? parsed : undefined
}

function scoreToDisplay(numericScore: number | undefined, fallback: string | undefined): string {
    if (typeof numericScore === 'number') {
        return numericScore.toFixed(2)
    }

    return fallback ?? 'Pending'
}

function determinePassFail(
    numericScore: number | undefined,
    minPass: number | null | undefined,
    baseResult: Screening['result'],
    metadata?: BackendReview['metadata'],
): Screening['result'] {
    if (typeof numericScore === 'number' && typeof minPass === 'number') {
        return numericScore >= minPass ? 'PASS' : 'NO PASS'
    }

    const normalizedBase = (baseResult || '').toUpperCase()
    if (normalizedBase === 'PASS' || normalizedBase === 'NO PASS') {
        return normalizedBase as Screening['result']
    }

    const outcomeFromMetadata = metadata ? extractOutcomeFromMetadata(metadata) : undefined
    if (outcomeFromMetadata) {
        return outcomeFromMetadata
    }

    return baseResult
}

function buildResourceFromReviewHandle(review: BackendReview | undefined): BackendResource | undefined {
    if (!review?.reviewerHandle) {
        return undefined
    }

    const rating = typeof review.reviewerMaxRating === 'number'
        ? review.reviewerMaxRating
        : undefined

    return {
        handleColor: getRatingColor(rating),
        memberHandle: review.reviewerHandle,
    } as BackendResource
}

function collectPhaseIdsForName(
    phases: BackendPhase[] | undefined,
    reviewers: ReviewerPhaseConfig[] | undefined,
    phaseName: string,
): Set<string> {
    const normalizedPhaseName = phaseName.toLowerCase()
    const ids = new Set<string>()

    phases?.forEach(phase => {
        if ((phase.name || '').toLowerCase() === normalizedPhaseName) {
            if (phase.phaseId) {
                ids.add(`${phase.phaseId}`)
            }

            if (phase.id) {
                ids.add(`${phase.id}`)
            }
        }
    })

    reviewers?.forEach(reviewer => {
        const matchesType = (reviewer.type || '').toLowerCase() === normalizedPhaseName
        const hasPhaseId = reviewer.phaseId !== undefined && reviewer.phaseId !== null
        if (matchesType && hasPhaseId) {
            ids.add(`${reviewer.phaseId}`)
        }
    })

    return ids
}

function resolvePhaseMeta(
    phaseName: string,
    phases: BackendPhase[] | undefined,
    reviewers: ReviewerPhaseConfig[] | undefined,
    reviews: BackendReview[] | undefined,
    legacyScorecardId?: string | number,
): { scorecardId?: string; phaseIds: Set<string> } {
    const normalizedPhaseName = phaseName.toLowerCase()
    const phaseIds = collectPhaseIdsForName(phases, reviewers, phaseName)

    const matchingPhases = phases?.filter(
        phase => (phase.name || '').toLowerCase() === normalizedPhaseName,
    ) ?? []

    const matchingReviewers = reviewers?.filter(reviewer => (
        (reviewer.type || '').toLowerCase() === normalizedPhaseName
    )) ?? []

    const logResolution = (
        source: string,
        resolvedScorecardId: string | undefined,
        extra: Record<string, unknown> = {},
    ): void => {
        debugLog('resolvePhaseMeta', {
            legacyScorecardId: legacyScorecardId ? `${legacyScorecardId}` : undefined,
            matchingPhaseCount: matchingPhases.length,
            matchingReviewerCount: matchingReviewers.length,
            phaseIds: Array.from(phaseIds.values()),
            phaseName,
            resolvedScorecardId,
            scorecardSource: source,
            ...extra,
        })
    }

    matchingPhases.forEach(phase => {
        if (phase.phaseId) {
            phaseIds.add(`${phase.phaseId}`)
        }

        if (phase.id) {
            phaseIds.add(`${phase.id}`)
        }
    })

    const reviewMatch = reviews?.find(review => {
        if (!review?.scorecardId) {
            return false
        }

        const reviewPhaseId = review.phaseId ? `${review.phaseId}` : undefined
        if (!reviewPhaseId) {
            return false
        }

        const matchesKnownPhase = phaseIds.has(reviewPhaseId)
            || matchingPhases.some(
                phase => `${phase.phaseId}` === reviewPhaseId || `${phase.id}` === reviewPhaseId,
            )

        if (matchesKnownPhase) {
            phaseIds.add(reviewPhaseId)
            return true
        }

        const reviewerTypeMatch = reviewers?.some(reviewer => {
            const reviewerPhaseId = reviewer.phaseId !== undefined && reviewer.phaseId !== null
                ? `${reviewer.phaseId}`
                : undefined
            const matchesType = (reviewer.type || '').toLowerCase() === normalizedPhaseName
            return matchesType && (!reviewerPhaseId || reviewerPhaseId === reviewPhaseId)
        })

        if (reviewerTypeMatch) {
            phaseIds.add(reviewPhaseId)
            return true
        }

        if (legacyScorecardId && `${legacyScorecardId}` === review.scorecardId) {
            phaseIds.add(reviewPhaseId)
            return true
        }

        return false
    })

    if (reviewMatch?.scorecardId) {
        logResolution('reviewMatch', reviewMatch.scorecardId, {
            matchedReviewId: reviewMatch.id,
            matchedReviewPhaseId: reviewMatch.phaseId,
        })
        return { phaseIds, scorecardId: reviewMatch.scorecardId }
    }

    const reviewerMatch = reviewers?.find(reviewer => {
        if (!reviewer?.scorecardId) {
            return false
        }

        const reviewerPhaseId = reviewer.phaseId !== undefined && reviewer.phaseId !== null
            ? `${reviewer.phaseId}`
            : undefined
        if (reviewerPhaseId) {
            phaseIds.add(reviewerPhaseId)
        }

        return (reviewer.type || '').toLowerCase() === normalizedPhaseName
            || (reviewerPhaseId ? phaseIds.has(reviewerPhaseId) : false)
    })

    if (reviewerMatch?.scorecardId) {
        logResolution('reviewerMatch', reviewerMatch.scorecardId, {
            matchedReviewer: reviewerMatch,
        })
        return { phaseIds, scorecardId: reviewerMatch.scorecardId }
    }

    const constraintValue = matchingPhases
        .map(phase => phase.constraints?.find(constraint => constraint.name === 'Scorecard')?.value)
        .find(value => value !== undefined && value !== null)

    if (constraintValue) {
        const scorecardId = `${constraintValue}`
        logResolution('phaseConstraint', scorecardId)
        return { phaseIds, scorecardId }
    }

    if (legacyScorecardId) {
        const scorecardId = `${legacyScorecardId}`
        logResolution('legacyScorecard', scorecardId)
        return { phaseIds, scorecardId }
    }

    const fallbackReviewWithScorecard = reviews?.find(review => {
        if (!review?.scorecardId) return false
        const reviewType = (review.typeId || '').trim()
            .toLowerCase()
        const typeMatches = reviewType === normalizedPhaseName
        const metaMatches = metadataMatchesPhase(review.metadata, normalizedPhaseName)
        const accept = typeMatches || metaMatches
        if (accept && review.phaseId) {
            phaseIds.add(`${review.phaseId}`)
        }

        return accept
    })

    if (fallbackReviewWithScorecard?.scorecardId) {
        logResolution('fallbackReview', fallbackReviewWithScorecard.scorecardId, {
            matchedReviewId: fallbackReviewWithScorecard.id,
            matchedReviewPhaseId: fallbackReviewWithScorecard.phaseId,
        })
        return { phaseIds, scorecardId: fallbackReviewWithScorecard.scorecardId }
    }

    logResolution('noScorecardResolved', undefined)
    return { phaseIds }
}

function normalizeReviewMetadata(metadata: BackendReview['metadata']): string {
    if (!metadata) {
        return ''
    }

    if (typeof metadata === 'string') {
        return metadata
    }

    if (typeof metadata === 'object') {
        try {
            return JSON.stringify(metadata)
        } catch {
            return ''
        }
    }

    return ''
}

type MetadataPhaseMatch = {
    source: 'jsonField' | 'stringExact' | 'stringBoundary'
    key?: string
}

function escapeRegexLiteral(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findMetadataPhaseMatch(
    metadata: BackendReview['metadata'],
    normalizedPhaseName: string,
): MetadataPhaseMatch | undefined {
    if (!metadata) {
        return undefined
    }

    const target = normalizedPhaseName.trim()
    if (!target) {
        return undefined
    }

    const metadataObject = parseReviewMetadataObject(metadata)
    if (metadataObject) {
        const candidateKeys = ['phaseName', 'phaseType', 'reviewType', 'type'] as const
        for (const key of candidateKeys) {
            const value = metadataObject[key]
            if (typeof value === 'string') {
                if (value.trim()
                    .toLowerCase() === target) {
                    return {
                        key,
                        source: 'jsonField',
                    }
                }
            }

            if (Array.isArray(value)) {
                const matched = value.some(item => typeof item === 'string'
                    && item.trim()
                        .toLowerCase() === target)
                if (matched) {
                    return {
                        key,
                        source: 'jsonField',
                    }
                }
            }
        }

        return undefined
    }

    if (typeof metadata === 'string') {
        const normalizedMetadata = metadata.trim()
            .toLowerCase()
        if (!normalizedMetadata) {
            return undefined
        }

        if (normalizedMetadata === target) {
            return { source: 'stringExact' }
        }

        const escapedTarget = escapeRegexLiteral(target)
            .replace(/ /g, '\\ ')
        const sepInsensitive = new RegExp(`\\b${escapedTarget.replace(/\\ /g, '[-_\\s]+')}\\b`)
        if (sepInsensitive.test(normalizedMetadata)) {
            return { source: 'stringBoundary' }
        }
    }

    return undefined
}

function metadataMatchesPhase(
    metadata: BackendReview['metadata'],
    normalizedPhaseName: string,
): boolean {
    return Boolean(findMetadataPhaseMatch(metadata, normalizedPhaseName))
}

type MetadataPhaseMatchDetail = ReturnType<typeof findMetadataPhaseMatch>

function getNormalizedLowerCase(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmedValue = value.trim()
    return trimmedValue ? trimmedValue.toLowerCase() : undefined
}

function isPhaseAllowedForReview(phaseName?: string | null): boolean {
    const normalized = getNormalizedLowerCase(phaseName)
    if (!normalized) {
        return true
    }

    return normalized === 'review'
}

function buildMetadataCriteria(detail: MetadataPhaseMatchDetail): string[] {
    if (!detail) {
        return []
    }

    if (detail.source === 'jsonField' && detail.key) {
        return [`metadataField:${detail.key}`]
    }

    if (detail.source === 'stringExact') {
        return ['metadataExactString']
    }

    if (detail.source === 'stringBoundary') {
        return ['metadataWordBoundary']
    }

    return ['metadataPhaseMatch']
}

function resolveReviewPhaseId(review: BackendReview | undefined): string | undefined {
    if (!review || review.phaseId === null || review.phaseId === undefined) {
        return undefined
    }

    return `${review.phaseId}`
}

function collectMatchedCriteria({
    matchesPhase,
    matchesScorecard,
    matchesTypeExact,
    metadataCriteria,
}: {
    matchesPhase: boolean
    matchesScorecard: boolean
    matchesTypeExact: boolean
    metadataCriteria: string[]
}): string[] {
    const criteria: string[] = []

    if (matchesScorecard) {
        criteria.push('scorecardId')
    }

    if (matchesPhase) {
        criteria.push('phaseId')
    }

    if (matchesTypeExact) {
        criteria.push('typeIdExact')
    }

    criteria.push(...metadataCriteria)

    return criteria
}

function logMissingReview(
    phaseIds: Set<string>,
    phaseName: string | undefined,
    scorecardId: string | undefined,
): void {
    debugLog('reviewMatchesPhase.start', {
        phaseIds: Array.from(phaseIds.values()),
        phaseName,
        reason: 'reviewMissing',
        reviewId: undefined,
        scorecardIdBeingChecked: scorecardId,
    })
    debugLog('reviewMatchesPhase.summary', {
        matchedCriteria: [],
        matchReason: 'none',
        result: false,
        reviewId: undefined,
    })
}

function handleNoPhaseMatch(
    review: BackendReview,
    matchesPhase: boolean,
    matchesScorecard: boolean,
): boolean {
    const matchedCriteria = [
        matchesScorecard ? 'scorecardId' : undefined,
        matchesPhase ? 'phaseId' : undefined,
    ].filter(Boolean) as string[]
    const result = matchedCriteria.length > 0

    debugLog('reviewMatchesPhase.criteria', {
        matchesMetadata: false,
        matchesPhase,
        matchesPhaseName: false,
        matchesScorecard,
        matchesTypeExact: false,
        metadataMatchDetail: undefined,
    })
    debugLog('reviewMatchesPhase.summary', {
        matchedCriteria,
        matchReason: matchedCriteria[0] ?? 'none',
        result,
        reviewId: review.id,
    })

    return result
}

function enforceExactPhaseNameMatch({
    normalizedPhaseName,
    normalizedReviewPhaseName,
    review,
    reviewPhaseName,
}: {
    normalizedPhaseName: string
    normalizedReviewPhaseName: string
    review: BackendReview
    reviewPhaseName: string
}): boolean {
    const matchesPhaseName = normalizedReviewPhaseName === normalizedPhaseName
    const matchedCriteria = matchesPhaseName ? ['phaseName'] : []

    debugLog('reviewMatchesPhase.phaseNameExactMatchRequired', {
        matchesPhaseName,
        normalizedPhaseName,
        normalizedReviewPhaseName,
        reviewId: review.id,
        reviewPhaseName: truncateForLog(reviewPhaseName),
    })
    debugLog('reviewMatchesPhase.summary', {
        earlyReturnReason: 'phaseNameExactMatchRequired',
        matchedCriteria,
        matchReason: matchedCriteria[0] ?? 'none',
        result: matchesPhaseName,
        reviewId: review.id,
    })

    return matchesPhaseName
}

function reviewMatchesPhase(
    review: BackendReview | undefined,
    scorecardId: string | undefined,
    phaseIds: Set<string>,
    phaseName?: string,
): boolean {
    if (!review) {
        logMissingReview(phaseIds, phaseName, scorecardId)
        return false
    }

    const metadataString = normalizeReviewMetadata(review.metadata)
    const reviewPhaseId = resolveReviewPhaseId(review)
    const matchesScorecard = Boolean(scorecardId && review.scorecardId === scorecardId)
    const matchesPhase = Boolean(reviewPhaseId && phaseIds.has(reviewPhaseId))

    debugLog('reviewMatchesPhase.start', {
        matchingStrategy: 'exactPhaseMatching',
        phaseIds: Array.from(phaseIds.values()),
        phaseName,
        reviewId: review.id,
        reviewProperties: {
            metadata: truncateForLog(metadataString),
            phaseId: review.phaseId,
            scorecardId: review.scorecardId,
            typeId: review.typeId,
        },
        scorecardIdBeingChecked: scorecardId,
    })

    const normalizedPhaseName = getNormalizedLowerCase(phaseName)
    if (!normalizedPhaseName) {
        return handleNoPhaseMatch(review, matchesPhase, matchesScorecard)
    }

    const reviewPhaseName = (review as { phaseName?: string | null }).phaseName ?? undefined
    const normalizedReviewPhaseName = getNormalizedLowerCase(reviewPhaseName)
    if (normalizedReviewPhaseName) {
        return enforceExactPhaseNameMatch({
            normalizedPhaseName,
            normalizedReviewPhaseName,
            review,
            reviewPhaseName: reviewPhaseName as string,
        })
    }

    const reviewType = getNormalizedLowerCase(review.typeId ?? undefined)
    const matchesTypeExact = Boolean(reviewType && reviewType === normalizedPhaseName)
    const metadataMatchDetail = findMetadataPhaseMatch(review.metadata, normalizedPhaseName)
    const matchesMetadata = Boolean(metadataMatchDetail)
    const metadataCriteria = buildMetadataCriteria(metadataMatchDetail)

    const matchedCriteria = collectMatchedCriteria({
        matchesPhase,
        matchesScorecard,
        matchesTypeExact,
        metadataCriteria,
    })

    const result = matchedCriteria.length > 0
    const primaryMatchReason = matchedCriteria[0] ?? 'none'

    debugLog('reviewMatchesPhase.criteria', {
        matchesMetadata,
        matchesPhase,
        matchesPhaseName: false,
        matchesScorecard,
        matchesTypeExact,
        metadataMatchDetail,
    })

    debugLog('reviewMatchesPhase.summary', {
        matchedCriteria,
        matchReason: primaryMatchReason,
        result,
        reviewId: review.id,
    })

    return result
}

export interface useFetchScreeningReviewProps {
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
    // screening data
    screening: Screening[]
    // checkpoint data (if any)
    checkpoint: Screening[]
    // checkpoint review data (if any)
    checkpointReview: Screening[]
    // review data
    review: SubmissionInfo[]
    submitterReviews: SubmissionInfo[]
    // approval reviews (one entry per approval review instance)
    approvalReviews: SubmissionInfo[]
    // post-mortem reviews (one entry per post-mortem instance)
    postMortemReviews: SubmissionInfo[]
    isLoading: boolean
    reviewProgress: number
}

/**
 * Fetch screening and review data
 * @returns challenge screening and review data
 */
export function useFetchScreeningReview(): useFetchScreeningReviewProps {
    const { actionChallengeRole }: useRoleProps = useRole()

    const {
        loginUserInfo,
        resourceRoleReviewer,
    }: ReviewAppContextModel = useContext(ReviewAppContext)

    // get challenge info from challenge detail context
    const {
        challengeId,
        challengeInfo,
        resourceMemberIdMapping,
        reviewers: challengeReviewers,
        resources,
        myResources,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)

    const challengeLegacy = (challengeInfo as unknown as {
        legacy?: {
            reviewScorecardId?: number | string
            screeningScorecardId?: number | string
        }
    } | undefined)?.legacy

    // fetch challenge submissions
    const {
        challengeSubmissions: allChallengeSubmissions,
        isLoading,
    }: useFetchChallengeSubmissionsProps = useFetchChallengeSubmissions(challengeId)

    const visibleChallengeSubmissions = useMemo<BackendSubmission[]>(
        () => allChallengeSubmissions,
        [allChallengeSubmissions],
    )

    const visibleSubmissionsById = useMemo(
        () => visibleChallengeSubmissions.reduce<Map<string, BackendSubmission>>(
            (accumulator, submission) => {
                if (submission.id) {
                    accumulator.set(submission.id, submission)
                }

                return accumulator
            },
            new Map<string, BackendSubmission>(),
        ),
        [visibleChallengeSubmissions],
    )

    const visibleSubmissionsByLegacyId = useMemo(
        () => visibleChallengeSubmissions.reduce<Map<string, BackendSubmission>>(
            (accumulator, submission) => {
                const legacyId = submission.legacySubmissionId
                if (legacyId) {
                    accumulator.set(`${legacyId}`, submission)
                }

                return accumulator
            },
            new Map<string, BackendSubmission>(),
        ),
        [visibleChallengeSubmissions],
    )

    const debugCheckpointPhases = DEBUG_CHECKPOINT_PHASES

    // Subsets by submission type for tab-specific displays
    const contestSubmissions = useMemo(
        () => visibleChallengeSubmissions.filter(s => {
            const submissionType = s.type?.trim()
            return submissionType?.toUpperCase() === 'CONTEST_SUBMISSION'
        }),
        [visibleChallengeSubmissions],
    )
    const finalFixSubmissions = useMemo(
        () => visibleChallengeSubmissions.filter(s => (s.type || '').toUpperCase() === 'STUDIO_FINAL_FIX_SUBMISSION'),
        [visibleChallengeSubmissions],
    )

    // Get list of reviewer ids
    const reviewerIds = useMemo(() => {
        let results: string[] = []

        const normalizeRoleName = (roleName?: string | null): string | undefined => roleName
            ?.trim()
            .toLowerCase()

        const reviewerRoleId = resourceRoleReviewer?.id

        if (challengeReviewers && challengeReviewers.length) {
            const reviewerRoleResources = filter(
                challengeReviewers,
                reviewer => {
                    const normalizedRoleName = normalizeRoleName(reviewer.roleName)
                    const matchesRoleName = normalizedRoleName === 'reviewer'
                    const matchesRoleId = !normalizedRoleName && reviewerRoleId
                        ? reviewer.roleId === reviewerRoleId
                        : false
                    return matchesRoleName || matchesRoleId
                },
            )

            results = (
                actionChallengeRole === REVIEWER
                    ? filter(
                        reviewerRoleResources,
                        reviewer => reviewer.memberId === `${loginUserInfo?.userId}`,
                    )
                    : reviewerRoleResources
            ).map(reviewer => reviewer.id)
        }

        if (!results.length) {
            const reviewerResourceIds = new Set(
                (resources ?? [])
                    .filter(resource => {
                        const normalizedRoleName = normalizeRoleName(resource.roleName)
                        const matchesRoleName = normalizedRoleName === 'reviewer'
                        const matchesRoleId = !normalizedRoleName && reviewerRoleId
                            ? resource.roleId === reviewerRoleId
                            : false
                        return matchesRoleName || matchesRoleId
                    })
                    .map(resource => resource.id)
                    .filter((id): id is string => Boolean(id)),
            )

            forEach(visibleChallengeSubmissions, challengeSubmission => {
                forEach(challengeSubmission.review, review => {
                    if (!isPhaseAllowedForReview(review.phaseName)) {
                        return
                    }

                    const resourceId = review.resourceId
                    if (!resourceId) {
                        return
                    }

                    if (reviewerResourceIds.size && !reviewerResourceIds.has(resourceId)) {
                        return
                    }

                    if (!results.includes(resourceId)) {
                        results.push(resourceId)
                    }
                })
            })
        }

        return results

    }, [
        challengeReviewers,
        visibleChallengeSubmissions,
        actionChallengeRole,
        loginUserInfo,
        resources,
        resourceRoleReviewer,
    ])

    // fetch appeal response
    const {
        mappingReviewAppeal,
        loadResourceAppeal,
        cancelLoadResourceAppeal,
    }: useFetchAppealQueueProps = useFetchAppealQueue()

    const reviewerKey = useMemo(
        () => reviewerIds
            .slice()
            .sort()
            .join(','),
        [reviewerIds],
    )

    const {
        data: challengeReviewsData,
        error: fetchChallengeReviewsError,
        isValidating: isValidatingChallengeReviews,
    }: SWRResponse<BackendReview[], Error> = useSWR<BackendReview[], Error>(
        `reviewBaseUrl/reviews/${challengeId}/${reviewerKey}`,
        {
            fetcher: () => fetchChallengeReviews(challengeId ?? ''),
            isPaused: () => !challengeId
                || (!reviewerIds.length && actionChallengeRole !== SUBMITTER),
        },
    )

    const challengeReviews = useMemo(
        () => challengeReviewsData,
        [challengeReviewsData],
    )

    // Resolve scorecard ids and phase ids for Screening / Checkpoint phases
    const screeningPhaseMeta = useMemo(
        () => resolvePhaseMeta(
            'Screening',
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.screeningScorecardId,
        ),
        [
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.screeningScorecardId,
        ],
    )
    const screeningScorecardId = screeningPhaseMeta.scorecardId
    const screeningPhaseIds = screeningPhaseMeta.phaseIds

    const checkpointScreeningPhaseMeta = useMemo(
        () => resolvePhaseMeta(
            'Checkpoint Screening',
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.screeningScorecardId,
        ),
        [
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.screeningScorecardId,
        ],
    )
    const checkpointScreeningScorecardId = checkpointScreeningPhaseMeta.scorecardId
    const checkpointScreeningPhaseIds = checkpointScreeningPhaseMeta.phaseIds

    const checkpointReviewPhaseMeta = useMemo(
        () => resolvePhaseMeta(
            'Checkpoint Review',
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.reviewScorecardId,
        ),
        [
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.reviewScorecardId,
        ],
    )
    const checkpointReviewScorecardId = checkpointReviewPhaseMeta.scorecardId
    const checkpointReviewPhaseIds = checkpointReviewPhaseMeta.phaseIds

    useEffect(() => {
        if (!debugCheckpointPhases) {
            return
        }

        const summary = (
            scorecardId: string | undefined,
            phaseIds: Set<string>,
            label: string,
        ): {
            label: string
            matches: number
            phaseIds: string[]
            scorecardId: string | undefined
        } => ({
            label,
            matches: (challengeReviews ?? []).filter(review => (
                reviewMatchesPhase(review, scorecardId, phaseIds, label)
            )).length,
            phaseIds: Array.from(phaseIds.values()),
            scorecardId,
        })

        console.debug('[useFetchScreeningReview] phase meta', {
            checkpointReview: summary(
                checkpointReviewScorecardId,
                checkpointReviewPhaseIds,
                'Checkpoint Review',
            ),
            checkpointScreening: summary(
                checkpointScreeningScorecardId,
                checkpointScreeningPhaseIds,
                'Checkpoint Screening',
            ),
            screening: summary(screeningScorecardId, screeningPhaseIds, 'Screening'),
        })
    }, [
        checkpointReviewPhaseIds,
        checkpointReviewScorecardId,
        checkpointScreeningPhaseIds,
        checkpointScreeningScorecardId,
        challengeReviews,
        debugCheckpointPhases,
        screeningPhaseIds,
        screeningScorecardId,
    ])

    // Fetch minimumPassingScore for screening and checkpoint review scorecards
    type ScorecardBase = { id: string; minimumPassingScore: number | null }
    const {
        data: screeningScorecardBase,
    }: SWRResponse<ScorecardBase | undefined, Error> = useSWR<ScorecardBase | undefined, Error>(
        `EnvironmentConfig.API.V6/scorecards/screening/${screeningScorecardId || ''}`,
        {
            fetcher: async () => {
                if (!screeningScorecardId) return undefined
                const rs = await xhrGetAsync<{
                    id: string
                    minimumPassingScore: number | null
                }>(`${EnvironmentConfig.API.V6}/scorecards/${screeningScorecardId}`)
                return rs
            },
            isPaused: () => !screeningScorecardId,
        },
    )

    const {
        data: checkpointScreeningScorecardBase,
    }: SWRResponse<ScorecardBase | undefined, Error> = useSWR<ScorecardBase | undefined, Error>(
        `EnvironmentConfig.API.V6/scorecards/checkpoint-screening/${checkpointScreeningScorecardId || ''}`,
        {
            fetcher: async () => {
                if (!checkpointScreeningScorecardId) return undefined
                const rs = await xhrGetAsync<{
                    id: string
                    minimumPassingScore: number | null
                }>(`${EnvironmentConfig.API.V6}/scorecards/${checkpointScreeningScorecardId}`)
                return rs
            },
            isPaused: () => !checkpointScreeningScorecardId,
        },
    )

    const {
        data: checkpointReviewScorecardBase,
    }: SWRResponse<ScorecardBase | undefined, Error> = useSWR<ScorecardBase | undefined, Error>(
        `EnvironmentConfig.API.V6/scorecards/checkpoint-review/${checkpointReviewScorecardId || ''}`,
        {
            fetcher: async () => {
                if (!checkpointReviewScorecardId) return undefined
                const rs = await xhrGetAsync<{
                    id: string
                    minimumPassingScore: number | null
                }>(`${EnvironmentConfig.API.V6}/scorecards/${checkpointReviewScorecardId}`)
                return rs
            },
            isPaused: () => !checkpointReviewScorecardId,
        },
    )

    useEffect(() => {
        if (fetchChallengeReviewsError) {
            handleError(fetchChallengeReviewsError)
        }
    }, [fetchChallengeReviewsError])

    const reviewAssignmentsBySubmission = useMemo(
        () => {
            const mapping: { [submissionId: string]: { [resourceId: string]: BackendReview } } = {}

            forEach(challengeReviews, reviewItem => {
                if (!reviewItem) {
                    return
                }

                if (!reviewerIds.includes(reviewItem.resourceId)) {
                    return
                }

                if (!mapping[reviewItem.submissionId]) {
                    mapping[reviewItem.submissionId] = {}
                }

                mapping[reviewItem.submissionId][reviewItem.resourceId] = reviewItem
            })

            return mapping
        },
        [challengeReviews, reviewerIds],
    )

    // get screening data from challenge submissions
    const screening = useMemo(
        () => {
            const screeningReviewsBySubmission = new Map<string, BackendReview>()
            if (challengeReviews && challengeReviews.length) {
                forEach(challengeReviews, rv => {
                    if (reviewMatchesPhase(rv, screeningScorecardId, screeningPhaseIds, 'Screening')) {
                        screeningReviewsBySubmission.set(rv.submissionId, rv)
                    }
                })
            }

            const minPass = screeningScorecardBase?.minimumPassingScore ?? undefined
            // Current viewer's Screener resource id (if they have this role)
            const myScreenerResourceId = (myResources ?? [])
                .find(r => {
                    const n = (r.roleName || '').toLowerCase()
                    return n.includes('screener') && !n.includes('checkpoint')
                })?.id
            // Only show CONTEST_SUBMISSION on Submission/Screening tabs
            // eslint-disable-next-line complexity
            return contestSubmissions.map(item => {
                const base = convertBackendSubmissionToScreening(item)
                let matchedReview = screeningReviewsBySubmission.get(item.id)
                if (!matchedReview && item.reviewResourceMapping) {
                    matchedReview = Object.values(item.reviewResourceMapping)
                        .find(review => reviewMatchesPhase(
                            review,
                            screeningScorecardId,
                            screeningPhaseIds,
                            'Screening',
                        ))
                }

                let numericScore = getNumericScore(matchedReview)
                let scoreDisplay = scoreToDisplay(numericScore, base.score)

                if (
                    numericScore === undefined
                    && matchedReview
                    && ['COMPLETED', 'SUBMITTED'].includes((matchedReview.status || '').toUpperCase())
                ) {
                    const submissionScore = parseSubmissionScore(item.screeningScore)
                    if (submissionScore !== undefined) {
                        numericScore = submissionScore
                        scoreDisplay = scoreToDisplay(numericScore, base.score)
                    }
                }

                const reviewForHandle = matchedReview
                const resolvedScreenerId = reviewForHandle?.resourceId ?? base.screenerId
                const result = determinePassFail(numericScore, minPass, base.result, matchedReview?.metadata)

                const myAssignment
                    = (myScreenerResourceId && challengeReviews)
                        ? challengeReviews.find(rv => (
                            rv.submissionId === item.id
                            && rv.resourceId === myScreenerResourceId
                            && reviewMatchesPhase(rv, screeningScorecardId, screeningPhaseIds, 'Screening')
                        ))
                        : undefined

                const defaultScreener = {
                    handleColor: '#2a2a2a',
                    memberHandle: 'Not assigned',
                } as BackendResource

                const screenerDisplay = (() => {
                    if (resolvedScreenerId) {
                        const resourceMatch = (resources ?? []).find(resource => resource.id === resolvedScreenerId)
                        if (resourceMatch) {
                            return resourceMatch
                        }

                        const assignmentReview = item.reviewResourceMapping?.[resolvedScreenerId]
                        const handleFromAssignment = buildResourceFromReviewHandle(assignmentReview)
                        if (handleFromAssignment) {
                            return handleFromAssignment
                        }
                    }

                    const handleFromMatchedReview = buildResourceFromReviewHandle(reviewForHandle)
                    if (handleFromMatchedReview) {
                        return handleFromMatchedReview
                    }

                    return defaultScreener
                })()

                return {
                    ...base,
                    myReviewId: myAssignment?.id,
                    myReviewResourceId: myAssignment?.resourceId,
                    myReviewStatus: myAssignment?.status ?? undefined,
                    result,
                    reviewId: matchedReview?.id,
                    reviewPhaseId: resolveReviewPhaseId(matchedReview),
                    reviewStatus: matchedReview?.status ?? undefined,
                    score: scoreDisplay,
                    screener: screenerDisplay,
                    screenerId: screenerDisplay?.id ?? resolvedScreenerId,
                    userInfo: resourceMemberIdMapping[base.memberId],
                }
            })
        },
        [
            challengeReviews,
            resourceMemberIdMapping,
            screeningScorecardBase?.minimumPassingScore,
            screeningPhaseIds,
            screeningScorecardId,
            contestSubmissions,
            resources,
        ],
    )

    // Build checkpoint rows if checkpoint submissions and reviews exist
    const checkpoint = useMemo(() => {
        const checkpointReviewsBySubmission = new Map<string, BackendReview>()
        const matchedReviewDebugRows: Array<{
            metadataPreview: string
            phaseId: string | number | undefined
            reviewId: string | undefined
            scorecardId: string | undefined
            submissionId: string
            typeId: string | undefined
        }> = []

        const totalReviewsEvaluated = challengeReviews?.length ?? 0

        if (challengeReviews && challengeReviews.length) {
            forEach(challengeReviews, rv => {
                const matches = reviewMatchesPhase(
                    rv,
                    checkpointScreeningScorecardId,
                    checkpointScreeningPhaseIds,
                    'Checkpoint Screening',
                )

                if (matches) {
                    checkpointReviewsBySubmission.set(rv.submissionId, rv)
                    if (debugCheckpointPhases) {
                        matchedReviewDebugRows.push({
                            metadataPreview: truncateForLog(normalizeReviewMetadata(rv.metadata)),
                            phaseId: rv.phaseId,
                            reviewId: rv.id,
                            scorecardId: rv.scorecardId,
                            submissionId: rv.submissionId,
                            typeId: rv.typeId ?? undefined,
                        })
                    }
                }
            })
        }

        if (debugCheckpointPhases) {
            debugLog('checkpointScreening.matches', {
                matchedReviewCount: matchedReviewDebugRows.length,
                matchedReviews: matchedReviewDebugRows,
                reviewMapBySubmission: Array.from(checkpointReviewsBySubmission.entries())
                    .map(([submissionId, review]) => ({
                        phaseId: review?.phaseId,
                        reviewId: review?.id,
                        scorecardId: review?.scorecardId,
                        submissionId,
                        typeId: review?.typeId,
                    })),
                totalReviewsEvaluated,
            })
        }

        const minPass = checkpointScreeningScorecardBase?.minimumPassingScore ?? undefined

        // Resolve a challenge-level Checkpoint Screener (if any) for handle display
        const checkpointScreenerResource = (resources ?? [])
            .find(r => (r.roleName || '').toLowerCase() === 'checkpoint screener')

        // Current viewer's Checkpoint Screener resource id (if they have this role)
        const myCheckpointScreenerResourceId = (myResources ?? [])
            .find(r => (r.roleName || '').toLowerCase() === 'checkpoint screener')?.id

        const checkpointSubmissions = visibleChallengeSubmissions
            .filter(s => (s.type || '').toUpperCase()
                .includes('CHECKPOINT'))

        const checkpointRows = checkpointSubmissions
            // eslint-disable-next-line complexity
            .map(item => {
                const base = convertBackendSubmissionToScreening(item)
                const matchedReview = checkpointReviewsBySubmission.get(item.id)
                let numericScore = getNumericScore(matchedReview)

                if (numericScore === undefined && matchedReview) {
                    const reviewStatus = (matchedReview.status || '').toUpperCase()
                    if (reviewStatus === 'COMPLETED' || reviewStatus === 'SUBMITTED') {
                        const submissionScore = parseSubmissionScore(item.screeningScore)
                        if (submissionScore !== undefined) {
                            numericScore = submissionScore
                        }
                    }
                }

                const scoreDisplay = scoreToDisplay(numericScore, base.score)

                let screenerId: string | undefined = base.screenerId
                if (matchedReview?.resourceId) {
                    screenerId = matchedReview.resourceId
                }

                const result = determinePassFail(numericScore, minPass, base.result, matchedReview?.metadata)

                // Determine screener to display: review assignment screener -> challenge-level screener -> Not assigned
                const screenerDisplay = ((): BackendResource => {
                    if (screenerId) {
                        const r = (resources ?? []).find(x => x.id === screenerId)
                        if (r) return r
                    }

                    if (checkpointScreenerResource) return checkpointScreenerResource
                    return {
                        handleColor: '#2a2a2a',
                        memberHandle: 'Not assigned',
                    } as BackendResource
                })()

                // Find a pending/in-progress assignment for current viewer (if any)
                const myAssignment
                    = (myCheckpointScreenerResourceId && challengeReviews)
                        ? challengeReviews.find(rv => (
                            rv.submissionId === item.id
                        && rv.resourceId === myCheckpointScreenerResourceId
                        && reviewMatchesPhase(
                            rv,
                            checkpointScreeningScorecardId,
                            checkpointScreeningPhaseIds,
                            'Checkpoint Screening',
                        )
                        ))
                        : undefined

                return {
                    ...base,
                    myReviewId: myAssignment?.id,
                    myReviewResourceId: myAssignment?.resourceId,
                    myReviewStatus: myAssignment?.status ?? undefined,
                    result,
                    reviewId: matchedReview?.id,
                    reviewPhaseId: resolveReviewPhaseId(matchedReview),
                    reviewStatus: matchedReview?.status ?? undefined,
                    score: scoreDisplay,
                    screener: screenerDisplay,
                    screenerId: screenerDisplay?.id || screenerId,
                    userInfo: resourceMemberIdMapping[base.memberId],
                }
            })

        if (debugCheckpointPhases) {
            debugLog('checkpointScreening.results', {
                checkpointRowCount: checkpointRows.length,
                matchedReviewsSummary: Array.from(checkpointReviewsBySubmission.entries())
                    .map(([submissionId, review]) => ({
                        phaseId: review?.phaseId,
                        reviewId: review?.id,
                        scorecardId: review?.scorecardId,
                        submissionId,
                        typeId: review?.typeId,
                    })),
                rows: checkpointRows.map(row => ({
                    result: row.result,
                    reviewId: row.reviewId,
                    score: row.score,
                    screenerId: row.screenerId,
                    submissionId: row.submissionId,
                })),
            })
        }

        return checkpointRows
    }, [
        challengeReviews,
        checkpointScreeningScorecardId,
        checkpointScreeningScorecardBase?.minimumPassingScore,
        checkpointScreeningPhaseIds,
        debugCheckpointPhases,
        resourceMemberIdMapping,
        resources,
        myResources,
        visibleChallengeSubmissions,
    ])

    // Build checkpoint review rows if checkpoint review submissions and reviews exist
    const checkpointReview = useMemo(() => {
        const checkpointReviewsBySubmission = new Map<string, BackendReview>()
        const matchedReviewDebugRows: Array<{
            metadataPreview: string
            phaseId: string | number | undefined
            reviewId: string | undefined
            scorecardId: string | undefined
            submissionId: string
            typeId: string | undefined
        }> = []

        const totalReviewsEvaluated = challengeReviews?.length ?? 0

        if (challengeReviews && challengeReviews.length) {
            forEach(challengeReviews, rv => {
                const matches = reviewMatchesPhase(
                    rv,
                    checkpointReviewScorecardId,
                    checkpointReviewPhaseIds,
                    'Checkpoint Review',
                )

                if (matches) {
                    checkpointReviewsBySubmission.set(rv.submissionId, rv)
                    if (debugCheckpointPhases) {
                        matchedReviewDebugRows.push({
                            metadataPreview: truncateForLog(normalizeReviewMetadata(rv.metadata)),
                            phaseId: rv.phaseId,
                            reviewId: rv.id,
                            scorecardId: rv.scorecardId,
                            submissionId: rv.submissionId,
                            typeId: rv.typeId ?? undefined,
                        })
                    }
                }
            })
        }

        if (debugCheckpointPhases) {
            debugLog('checkpointReview.matches', {
                matchedReviewCount: matchedReviewDebugRows.length,
                matchedReviews: matchedReviewDebugRows,
                reviewMapBySubmission: Array.from(checkpointReviewsBySubmission.entries())
                    .map(([submissionId, review]) => ({
                        phaseId: review?.phaseId,
                        reviewId: review?.id,
                        scorecardId: review?.scorecardId,
                        submissionId,
                        typeId: review?.typeId,
                    })),
                totalReviewsEvaluated,
            })
        }

        const minPass = checkpointReviewScorecardBase?.minimumPassingScore ?? undefined

        const checkpointReviewerResources = (resources ?? [])
            .filter(r => (r.roleName || '').toLowerCase() === 'checkpoint reviewer')
        const fallbackCheckpointReviewer = checkpointReviewerResources.length === 1
            ? checkpointReviewerResources[0]
            : undefined

        // Current viewer's Checkpoint Reviewer resource id (if they have this role)
        const myCheckpointReviewerResourceId = (myResources ?? [])
            .find(r => (r.roleName || '').toLowerCase() === 'checkpoint reviewer')?.id

        const checkpointSubmissions = visibleChallengeSubmissions
            .filter(s => (s.type || '').toUpperCase()
                .includes('CHECKPOINT'))

        const checkpointReviewRows = checkpointSubmissions.reduce<Screening[]>((rows, item) => {
            const matchedReview = checkpointReviewsBySubmission.get(item.id)
            if (!matchedReview) {
                return rows
            }

            const base = convertBackendSubmissionToScreening(item)
            let numericScore = getNumericScore(matchedReview)

            if (numericScore === undefined) {
                const reviewStatus = (matchedReview.status || '').toUpperCase()
                if (reviewStatus === 'COMPLETED' || reviewStatus === 'SUBMITTED') {
                    const submissionScore = parseSubmissionScore(item.screeningScore)
                    if (submissionScore !== undefined) {
                        numericScore = submissionScore
                    }
                }
            }

            const scoreDisplay = scoreToDisplay(numericScore, 'Pending')

            const screenerId = matchedReview.resourceId ?? base.screenerId
            const result = determinePassFail(numericScore, minPass, base.result, matchedReview.metadata)

            const myAssignment
                = (myCheckpointReviewerResourceId && challengeReviews)
                    ? challengeReviews.find(rv => (
                        rv.submissionId === item.id
                        && rv.resourceId === myCheckpointReviewerResourceId
                        && reviewMatchesPhase(
                            rv,
                            checkpointReviewScorecardId,
                            checkpointReviewPhaseIds,
                            'Checkpoint Review',
                        )
                    ))
                    : undefined

            const reviewerDisplay = ((): BackendResource => {
                if (screenerId) {
                    const resourceMatch = (resources ?? []).find(x => x.id === screenerId)
                    if (resourceMatch) {
                        return resourceMatch
                    }

                    if (matchedReview.reviewerHandle) {
                        return {
                            handleColor: '#2a2a2a',
                            memberHandle: matchedReview.reviewerHandle,
                        } as BackendResource
                    }
                }

                if (fallbackCheckpointReviewer) {
                    return fallbackCheckpointReviewer
                }

                return {
                    handleColor: '#2a2a2a',
                    memberHandle: 'Not assigned',
                } as BackendResource
            })()

            rows.push({
                ...base,
                myReviewId: myAssignment?.id,
                myReviewResourceId: myAssignment?.resourceId,
                myReviewStatus: myAssignment?.status ?? undefined,
                result,
                reviewId: matchedReview.id,
                reviewPhaseId: resolveReviewPhaseId(matchedReview),
                reviewStatus: matchedReview.status ?? undefined,
                score: scoreDisplay,
                screener: reviewerDisplay,
                screenerId: reviewerDisplay?.id || screenerId,
                userInfo: resourceMemberIdMapping[base.memberId],
            })

            return rows
        }, [])

        if (debugCheckpointPhases) {
            debugLog('checkpointReview.results', {
                checkpointReviewRowCount: checkpointReviewRows.length,
                matchedReviewsSummary: Array.from(checkpointReviewsBySubmission.entries())
                    .map(([submissionId, review]) => ({
                        phaseId: review?.phaseId,
                        reviewId: review?.id,
                        scorecardId: review?.scorecardId,
                        submissionId,
                        typeId: review?.typeId,
                    })),
                rows: checkpointReviewRows.map(row => ({
                    result: row.result,
                    reviewId: row.reviewId,
                    score: row.score,
                    screenerId: row.screenerId,
                    submissionId: row.submissionId,
                })),
            })
        }

        return checkpointReviewRows
    }, [
        challengeReviews,
        checkpointReviewScorecardId,
        checkpointReviewScorecardBase?.minimumPassingScore,
        checkpointReviewPhaseIds,
        debugCheckpointPhases,
        myResources,
        resources,
        resourceMemberIdMapping,
        visibleChallengeSubmissions,
    ])

    useEffect(() => {
        if (!debugCheckpointPhases) {
            return
        }

        const reviewById = new Map<string, BackendReview>()
        if (challengeReviews && challengeReviews.length) {
            forEach(challengeReviews, reviewItem => {
                if (reviewItem?.id) {
                    reviewById.set(reviewItem.id, reviewItem)
                }
            })
        }

        const checkpointReviewIds = new Set(
            checkpoint
                .map(item => item.reviewId)
                .filter((id): id is string => Boolean(id)),
        )
        const checkpointReviewTabIds = new Set(
            checkpointReview
                .map(item => item.reviewId)
                .filter((id): id is string => Boolean(id)),
        )

        const overlappingReviewIds = Array.from(checkpointReviewIds)
            .filter(id => checkpointReviewTabIds.has(id))

        const miscategorizedCheckpoint = checkpoint
            .map(entry => {
                const review = entry.reviewId ? reviewById.get(entry.reviewId) : undefined
                return { entry, review }
            })
            .filter(({ review }: { review: BackendReview | undefined }) => (
                Boolean(review && (review.typeId || '').toLowerCase()
                    .includes('checkpoint review'))
            ))

        const miscategorizedCheckpointReview = checkpointReview
            .map(entry => {
                const review = entry.reviewId ? reviewById.get(entry.reviewId) : undefined
                return { entry, review }
            })
            .filter(({ review }: { review: BackendReview | undefined }) => (
                Boolean(review && (review.typeId || '').toLowerCase()
                    .includes('checkpoint screening'))
            ))

        const formatReviewDetails = (
            review: BackendReview | undefined,
        ): Record<string, unknown> | undefined => (
            review
                ? {
                    id: review.id,
                    metadataPreview: truncateForLog(normalizeReviewMetadata(review.metadata)),
                    phaseId: review.phaseId,
                    scorecardId: review.scorecardId,
                    typeId: review.typeId ?? undefined,
                }
                : undefined
        )

        const payload: Record<string, unknown> = {
            checkpointMismatches: miscategorizedCheckpoint.map(
                ({ entry, review }: { entry: Screening; review: BackendReview | undefined }) => ({
                    checkpointEntry: {
                        result: entry.result,
                        reviewId: entry.reviewId,
                        submissionId: entry.submissionId,
                    },
                    review: formatReviewDetails(review),
                }),
            ),
            checkpointReviewMismatches: miscategorizedCheckpointReview.map(
                ({ entry, review }: { entry: Screening; review: BackendReview | undefined }) => ({
                    checkpointReviewEntry: {
                        result: entry.result,
                        reviewId: entry.reviewId,
                        submissionId: entry.submissionId,
                    },
                    review: formatReviewDetails(review),
                }),
            ),
            overlappingReviewCount: overlappingReviewIds.length,
            overlappingReviewIds,
            totalCheckpointEntries: checkpoint.length,
            totalCheckpointReviewEntries: checkpointReview.length,
        }

        const recommendations: string[] = []

        miscategorizedCheckpoint.forEach(({ review }: { review: BackendReview | undefined }) => {
            if (review?.id) {
                recommendations.push(
                    `Review ${review.id} (typeId: ${review.typeId ?? 'unknown'}) appears in checkpoint data `
                    + 'but matches Checkpoint Review criteria.',
                )
            }
        })

        miscategorizedCheckpointReview.forEach(({ review }: { review: BackendReview | undefined }) => {
            if (review?.id) {
                recommendations.push(
                    `Review ${review.id} (typeId: ${review.typeId ?? 'unknown'}) appears in checkpoint review data `
                    + 'but matches Checkpoint Screening criteria.',
                )
            }
        })

        if (recommendations.length) {
            payload.recommendations = recommendations
        }

        if (
            overlappingReviewIds.length
            || miscategorizedCheckpoint.length
            || miscategorizedCheckpointReview.length
        ) {
            warnLog('checkpointCrossReference', payload)
        } else {
            debugLog('checkpointCrossReference', {
                ...payload,
                message: 'Checkpoint and Checkpoint Review data sets are distinct with no misclassifications detected.',
            })
        }
    }, [
        challengeReviews,
        checkpoint,
        checkpointReview,
        debugCheckpointPhases,
    ])

    const submitterReviewEntries = useMemo<BackendReview[]>(() => {
        if (actionChallengeRole !== SUBMITTER) {
            return challengeReviews ?? []
        }

        const allowedReviewerIds = reviewerIds.length ? new Set(reviewerIds) : undefined

        if (challengeReviews && challengeReviews.length) {
            const filteredReviews = (challengeReviews ?? []).filter(review => {
                if (!review) {
                    return false
                }

                if (!isPhaseAllowedForReview(review.phaseName)) {
                    return false
                }

                if (allowedReviewerIds?.size) {
                    return Boolean(
                        review.resourceId && allowedReviewerIds.has(review.resourceId),
                    )
                }

                return true
            })

            if (filteredReviews.length) {
                return filteredReviews
            }
        }

        const fallbackReviews: BackendReview[] = []
        forEach(visibleChallengeSubmissions, submission => {
            forEach(submission.review, reviewItem => {
                if (!isPhaseAllowedForReview(reviewItem?.phaseName)) {
                    return
                }

                const resourceId = reviewItem?.resourceId
                if (allowedReviewerIds?.size) {
                    if (!resourceId || !allowedReviewerIds.has(resourceId)) {
                        return
                    }
                }

                if (reviewItem?.id) {
                    fallbackReviews.push({
                        ...reviewItem,
                        legacySubmissionId: reviewItem.legacySubmissionId || submission.legacySubmissionId,
                        submissionId: reviewItem.submissionId || submission.id,
                    })
                }
            })
        })

        if (fallbackReviews.length) {
            return fallbackReviews
        }

        const filteredByPhase = (challengeReviews ?? []).filter(review => (
            review ? isPhaseAllowedForReview(review.phaseName) : false
        ))

        return filteredByPhase
    }, [
        actionChallengeRole,
        challengeReviews,
        visibleChallengeSubmissions,
        reviewerIds,
    ])

    // get review data from challenge submissions
    const submitterReviews = useMemo(() => {
        if (actionChallengeRole !== SUBMITTER) {
            return []
        }

        if (!submitterReviewEntries.length) {
            return []
        }

        const memberId = loginUserInfo?.userId
            ? `${loginUserInfo.userId}`
            : ''
        const resolvedReviews = submitterReviewEntries
            .map((reviewItem, index) => {
                const matchingSubmission = resolveSubmissionForReview({
                    review: reviewItem,
                    submissionsById: visibleSubmissionsById,
                    submissionsByLegacyId: visibleSubmissionsByLegacyId,
                })

                const submissionType = matchingSubmission?.type?.trim()
                if (submissionType?.toUpperCase() !== 'CONTEST_SUBMISSION') {
                    return undefined
                }

                const submissionWithReview: BackendSubmission | undefined = matchingSubmission
                    ? {
                        ...matchingSubmission,
                        review: [reviewItem],
                    }
                    : undefined

                const baseSubmissionInfo = submissionWithReview
                    ? convertBackendSubmissionToSubmissionInfo(submissionWithReview)
                    : undefined

                const fallbackId = resolveFallbackSubmissionId({
                    baseSubmissionInfo,
                    defaultId: `${memberId || 'submission'}-${index}`,
                    matchingSubmission,
                    review: reviewItem,
                })

                if (!fallbackId) {
                    return undefined
                }

                const resolvedMemberId = resolveSubmitterMemberId({
                    baseSubmissionInfo,
                    matchingSubmission,
                })

                const reviewInfo = convertBackendReviewToReviewInfo(reviewItem)
                const reviewResult = convertBackendReviewToReviewResult(reviewItem)

                return {
                    ...baseSubmissionInfo,
                    id: fallbackId,
                    isLatest: baseSubmissionInfo?.isLatest
                        ?? matchingSubmission?.isLatest
                        ?? true,
                    memberId: resolvedMemberId,
                    review: reviewInfo,
                    reviews: [reviewResult],
                    submittedDate: baseSubmissionInfo?.submittedDate,
                    submittedDateString: baseSubmissionInfo?.submittedDateString,
                    userInfo: resolvedMemberId
                        ? resourceMemberIdMapping[resolvedMemberId]
                        : undefined,
                    virusScan: baseSubmissionInfo?.virusScan,
                } as SubmissionInfo
            })
            .filter((entry): entry is SubmissionInfo => Boolean(entry))

        return resolvedReviews
    }, [
        actionChallengeRole,
        loginUserInfo?.userId,
        resourceMemberIdMapping,
        visibleSubmissionsById,
        visibleSubmissionsByLegacyId,
        submitterReviewEntries,
    ])

    const review = useMemo(() => {
        const validReviews: BackendSubmission[] = []
        // Only show CONTEST_SUBMISSION on Review tabs
        forEach(contestSubmissions, challengeSubmission => {
            forEach(reviewerIds, reviewerId => {
                const matchingReview
                    = challengeSubmission.reviewResourceMapping?.[reviewerId]
                const assignmentReview
                    = reviewAssignmentsBySubmission[challengeSubmission.id]?.[reviewerId]

                let reviewForResource = matchingReview

                if (assignmentReview) {
                    if (reviewForResource) {
                        reviewForResource = {
                            ...reviewForResource,
                            committed: assignmentReview.committed,
                            id: assignmentReview.id,
                            reviewerHandle: assignmentReview.reviewerHandle,
                            reviewerMaxRating: assignmentReview.reviewerMaxRating,
                            status: assignmentReview.status,
                            submissionId: assignmentReview.submissionId,
                        }
                    } else {
                        reviewForResource = {
                            ...assignmentReview,
                            reviewItems: assignmentReview.reviewItems ?? [],
                        }
                    }
                }

                if (!reviewForResource) {
                    const emptyReview = {
                        ...createEmptyBackendReview(),
                        resourceId: reviewerId,
                        submissionId: challengeSubmission.id,
                    }
                    reviewForResource = emptyReview
                }

                validReviews.push({
                    ...challengeSubmission,
                    review: [reviewForResource],
                    reviewResourceMapping: {
                        ...(challengeSubmission.reviewResourceMapping ?? {}),
                        [reviewerId]: reviewForResource,
                    },
                })
            })
        })
        return validReviews.map(item => {
            const result = convertBackendSubmissionToSubmissionInfo(item)
            return {
                ...result,
                userInfo: resourceMemberIdMapping[result.memberId],
            }
        })
    }, [
        contestSubmissions,
        resourceMemberIdMapping,
        reviewerIds,
        reviewAssignmentsBySubmission,
    ])

    // Build approval reviews list (one entry per approval review instance)
    const approvalReviews = useMemo<SubmissionInfo[]>(() => {
        const approvalPhaseIds = new Set(
            (challengeInfo?.phases ?? [])
                .filter(p => (p.name || '').toLowerCase() === 'approval')
                .map(p => p.id),
        )

        if (!challengeReviews?.length || approvalPhaseIds.size === 0) {
            return []
        }

        // Only map to STUDIO_FINAL_FIX_SUBMISSION submissions for Approval tab
        const submissionsById = new Map(finalFixSubmissions.map(s => [s.id, s]))
        const result: SubmissionInfo[] = []

        forEach(challengeReviews, rv => {
            if (!rv) return
            if (!approvalPhaseIds.has(rv.phaseId)) return
            const submission = submissionsById.get(rv.submissionId)
            if (!submission) return

            const reviewInfo = convertBackendReviewToReviewInfo(rv)
            result.push({
                id: submission.id,
                memberId: submission.memberId,
                review: reviewInfo,
                reviews: [convertBackendReviewToReviewResult(rv)],
                userInfo: resourceMemberIdMapping[submission.memberId],
            })
        })

        return result
    }, [challengeInfo?.phases, challengeReviews, resourceMemberIdMapping, finalFixSubmissions])

    // Build post-mortem reviews list (for Topgear Task challenges)
    const postMortemReviews = useMemo<SubmissionInfo[]>(() => {
        const postMortemPhaseIds = new Set(
            (challengeInfo?.phases ?? [])
                .filter(p => ((p.name || '').toLowerCase()
                    .replace(/[^a-z]/g, '') === 'postmortem'))
                .map(p => p.id),
        )

        if (!challengeReviews?.length || postMortemPhaseIds.size === 0) {
            return []
        }

        const submissionsById = new Map(visibleChallengeSubmissions.map(s => [s.id, s]))
        const allowedReviewerIds = new Set(reviewerIds)
        const result: SubmissionInfo[] = []

        forEach(challengeReviews, rv => {
            if (!rv) return
            if (!postMortemPhaseIds.has(rv.phaseId)) return
            if (allowedReviewerIds.size > 0 && !allowedReviewerIds.has(rv.resourceId)) return
            const submission = submissionsById.get(rv.submissionId)
            if (!submission) return

            const reviewInfo = convertBackendReviewToReviewInfo(rv)
            result.push({
                id: submission.id,
                memberId: submission.memberId,
                review: reviewInfo,
                reviews: [convertBackendReviewToReviewResult(rv)],
                userInfo: resourceMemberIdMapping[submission.memberId],
            })
        })

        return result
    }, [challengeInfo?.phases, challengeReviews, resourceMemberIdMapping, visibleChallengeSubmissions])

    useEffect(() => {
        const reviewSources: SubmissionInfo[] = actionChallengeRole === SUBMITTER
            ? submitterReviews
            : review
        const processed = new Set<string>()

        forEach<SubmissionInfo>(reviewSources, item => {
            const reviewId = item.review?.id

            if (reviewId && !processed.has(reviewId)) {
                loadResourceAppeal(reviewId)
                processed.add(reviewId)
            }
        })
    }, [actionChallengeRole, loadResourceAppeal, review, submitterReviews])

    // get review progress from challenge review
    const reviewProgress = useMemo(() => {
        if (!review.length) {
            return 0
        }

        const isDesignChallenge = challengeInfo?.track.name === DESIGN

        const filteredReviews = isDesignChallenge
            ? review
            : review.filter(item => item.isLatest)

        if (!filteredReviews.length) {
            return 0
        }

        const completedReviews = filteredReviews.filter(item => {
            const committed = item.review?.committed
            if (typeof committed === 'boolean') {
                return committed
            }

            const status = item.review?.status
            if (typeof status === 'string' && status.trim()) {
                return status.trim()
                    .toUpperCase() === 'COMPLETED'
            }

            if (!item.reviews?.length) {
                return false
            }

            return every(
                item.reviews,
                reviewResult => typeof reviewResult.score === 'number'
                    && Number.isFinite(reviewResult.score),
            )
        })

        return Math.round(
            (completedReviews.length * 100) / filteredReviews.length,
        )
    }, [review, challengeInfo])

    useEffect(() => () => {
        cancelLoadResourceAppeal()
    }, [cancelLoadResourceAppeal])

    const shouldAwaitSubmitterReviews = actionChallengeRole === SUBMITTER
        ? false
        : (isValidatingChallengeReviews && visibleChallengeSubmissions.length > 0)

    return {
        approvalReviews,
        checkpoint,
        checkpointReview,
        isLoading: isLoading || shouldAwaitSubmitterReviews,
        mappingReviewAppeal,
        postMortemReviews,
        review,
        reviewProgress,
        screening,
        submitterReviews,
    }
}
