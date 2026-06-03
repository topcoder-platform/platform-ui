import { startCase, toLower } from 'lodash'

import { CHALLENGE_STATUS } from '../constants'
import {
    Challenge,
    ChallengePhase,
    ChallengeType,
    ChallengeTypeRef,
    ReviewSummation,
} from '../models'

interface SubmissionScore {
    finalScore?: number
    provisionalScore?: number
}

interface ScoredSubmissionLike {
    review?: Array<{
        initialScore?: number
        finalScore?: number
        score?: number
    }>
    reviewSummation?: ReviewSummation[]
    submissions?: SubmissionScore[]
}

/**
 * Display metadata for marathon test progress columns.
 */
export interface SubmissionTestProgressDisplay {
    process?: 'provisional' | 'system'
    progressPercent?: string
    status?: 'FAILED' | 'IN PROGRESS' | 'SUCCESS'
}

interface SubmissionTestProgressCandidate extends SubmissionTestProgressDisplay {
    inProgressPriority: number
    processPriority: number
    progress?: number
    statusPriority: number
    updatedAt: number
}

const MARATHON_MATCH_TYPE_IDS = new Set([
    '929bc408-9cf2-4b3e-ba71-adfbf693046c',
])

function getPhaseStartDate(phase: ChallengePhase): string {
    const phaseStartDate = phase.actualStartDate || phase.scheduledStartDate

    if (!phaseStartDate) {
        return ''
    }

    return phaseStartDate instanceof Date
        ? phaseStartDate.toISOString()
        : phaseStartDate
}

function phasePriority(phase: ChallengePhase): number {
    const normalizedName = (phase.name || '').toLowerCase()

    if (normalizedName === 'registration') {
        return 0
    }

    if (normalizedName === 'submission') {
        return 1
    }

    return 2
}

function normalizePhases(phases: ChallengePhase[] = []): ChallengePhase[] {
    return [...phases].sort((phaseA, phaseB) => {
        const dateA = getPhaseStartDate(phaseA)
        const dateB = getPhaseStartDate(phaseB)

        if (dateA < dateB) {
            return -1
        }

        if (dateA > dateB) {
            return 1
        }

        return phasePriority(phaseA) - phasePriority(phaseB)
    })
}

function normalizeStatus(status?: string): string {
    return (status || '')
        .trim()
        .toUpperCase()
}

function toValidScore(value: unknown): number | undefined {
    const score = Number(value)

    return Number.isFinite(score) && score >= 0
        ? score
        : undefined
}

function getAverageScore(scores: Array<number | undefined>): number | undefined {
    const validScores = scores
        .filter((score): score is number => score !== undefined)

    if (!validScores.length) {
        return undefined
    }

    const totalScore = validScores.reduce(
        (result, score) => result + score,
        0,
    )

    return totalScore / validScores.length
}

/**
 * Resolves the best timestamp available for ordering scored review summations.
 * @param entry Review summation returned by Review API.
 * @returns Epoch milliseconds or 0 when no parseable timestamp exists.
 * Used by marathon score display to pick the latest relative-scoring update.
 */
function getReviewSummationScoreTimestamp(entry: ReviewSummation): number {
    const timestamp = entry.updatedAt || entry.createdAt || ''
    const parsedTimestamp = Date.parse(timestamp)

    return Number.isFinite(parsedTimestamp)
        ? parsedTimestamp
        : 0
}

/**
 * Returns the latest valid score from matching Review API summations.
 * @param reviewSummation Review summations attached to a submission.
 * @param matcher Predicate that selects the requested Marathon Match score phase.
 * @returns Latest valid aggregate score, or `undefined` when no matching score exists.
 * Used by marathon score display so relative-score rewrites replace stale raw scores.
 */
function getScoreFromSummation(
    reviewSummation: ReviewSummation[] | undefined,
    matcher: (entry: ReviewSummation) => boolean,
): number | undefined {
    if (!Array.isArray(reviewSummation) || !reviewSummation.length) {
        return undefined
    }

    const matchedSummation = reviewSummation
        .map((entry, index) => ({
            entry,
            index,
            score: toValidScore(entry.aggregateScore),
            timestamp: getReviewSummationScoreTimestamp(entry),
        }))
        .filter(item => item.score !== undefined && matcher(item.entry))
        .sort((first, second) => (
            second.timestamp - first.timestamp
            || second.index - first.index
        ))[0]

    return matchedSummation?.score
}

/**
 * Resolves the marathon scoring phase represented by a review summation.
 * @param entry Review summation returned by Review API.
 * @returns `provisional`, `system`, or `undefined` when the summation is not a scored marathon phase.
 * Used by strict marathon score helpers so progress/example reviews do not leak into score display.
 */
function getReviewSummationTestProcess(
    entry: ReviewSummation,
): 'provisional' | 'system' | undefined {
    const metadataProcess = normalizeTestProcess(
        entry.metadata?.testProcess
        ?? entry.metadata?.testType,
    )

    if (metadataProcess) {
        return metadataProcess
    }

    const metadataStage = typeof entry.metadata?.stage === 'string'
        ? entry.metadata.stage.trim()
            .toLowerCase()
        : ''

    if (metadataStage === 'final') {
        return 'system'
    }

    if (entry.isFinal === true) {
        return 'system'
    }

    if (entry.isProvisional === true) {
        return 'provisional'
    }

    if (entry.isFinal === false && entry.isExample !== true) {
        return 'provisional'
    }

    return undefined
}

function getChallengeTypeName(type: string | ChallengeTypeRef | undefined): string | undefined {
    if (!type) {
        return undefined
    }

    if (typeof type === 'string') {
        return type
    }

    return type.name
}

/**
 * Normalizes review summation metadata test process aliases for marathon display.
 * @param value Metadata process or legacy test type value from Review API.
 * @returns `provisional` or `system` when the value identifies a tracked process.
 * Used by `getSubmissionTestProgress` to avoid showing example-test metadata.
 */
function normalizeTestProcess(value: unknown): 'provisional' | 'system' | undefined {
    const normalized = typeof value === 'string'
        ? value.trim()
            .toLowerCase()
        : ''

    if (normalized === 'system' || normalized === 'final') {
        return 'system'
    }

    if (normalized === 'provisional') {
        return 'provisional'
    }

    return undefined
}

/**
 * Normalizes review summation metadata test status for marathon display.
 * @param value Metadata status value from Review API.
 * @returns Supported UI status or `undefined` when the status is absent/unknown.
 * Used by `getSubmissionTestProgress` before choosing the current summation.
 */
function normalizeTestStatus(value: unknown): 'FAILED' | 'IN PROGRESS' | 'SUCCESS' | undefined {
    const normalized = typeof value === 'string'
        ? value.trim()
            .toUpperCase()
        : ''

    if (normalized === 'FAILED' || normalized === 'IN PROGRESS' || normalized === 'SUCCESS') {
        return normalized
    }

    return undefined
}

/**
 * Normalizes review summation metadata progress into the supported 0-to-1 range.
 * @param value Metadata progress value from Review API.
 * @returns Clamped numeric progress or `undefined` when no finite value exists.
 * Used by `getSubmissionTestProgress` to format percent text.
 */
function normalizeTestProgress(value: unknown): number | undefined {
    const progress = typeof value === 'string'
        ? Number(value)
        : value

    if (typeof progress !== 'number' || !Number.isFinite(progress)) {
        return undefined
    }

    return Math.min(Math.max(progress, 0), 1)
}

/**
 * Resolves the best timestamp available for ordering test progress summations.
 * @param entry Review summation containing marathon metadata.
 * @returns Epoch milliseconds or 0 when no parseable timestamp exists.
 * Used by `getSubmissionTestProgress` to choose the latest non-running process.
 */
function getTestProgressUpdatedAt(entry: ReviewSummation): number {
    const updatedAt = entry.metadata?.testProgressDetails?.updatedAt
        || entry.updatedAt
        || entry.createdAt
        || ''
    const parsedTimestamp = Date.parse(updatedAt)

    return Number.isFinite(parsedTimestamp)
        ? parsedTimestamp
        : 0
}

/**
 * Builds a sortable marathon test-progress candidate from review summation metadata.
 * @param entry Review summation returned with optional metadata from Review API.
 * @returns Candidate display data or `undefined` when no marathon progress metadata exists.
 * Used by `getSubmissionTestProgress` to select the current process for a submission row.
 */
function toSubmissionTestProgressCandidate(
    entry: ReviewSummation,
): SubmissionTestProgressCandidate | undefined {
    const process = normalizeTestProcess(
        entry.metadata?.testProcess
        ?? entry.metadata?.testType,
    )
    const status = normalizeTestStatus(entry.metadata?.testStatus)
    const progress = normalizeTestProgress(entry.metadata?.testProgress)
    let statusPriority = 0

    if (status === 'FAILED') {
        statusPriority = 2
    } else if (status === 'SUCCESS') {
        statusPriority = 1
    }

    if (!process && !status && progress === undefined) {
        return undefined
    }

    return {
        inProgressPriority: status === 'IN PROGRESS'
            ? 1
            : 0,
        process,
        processPriority: process === 'system'
            ? 1
            : 0,
        progress,
        progressPercent: progress === undefined
            ? undefined
            : `${Math.round(progress * 100)}%`,
        status,
        statusPriority,
        updatedAt: getTestProgressUpdatedAt(entry),
    }
}

/**
 * Returns display-ready marathon match test progress for one submission.
 * @param submission Submission-like object containing Review API summations.
 * @returns Current process, status, and percent text when present in summation metadata.
 * Used by `SubmissionsTable` to render marathon-only test progress columns.
 */
export function getSubmissionTestProgress(
    submission: Pick<ScoredSubmissionLike, 'reviewSummation'>,
): SubmissionTestProgressDisplay {
    const candidates = (submission.reviewSummation || [])
        .map(entry => toSubmissionTestProgressCandidate(entry))
        .filter((entry): entry is SubmissionTestProgressCandidate => !!entry)
        .sort((first, second) => (
            second.inProgressPriority - first.inProgressPriority
            || second.updatedAt - first.updatedAt
            || second.processPriority - first.processPriority
            || second.statusPriority - first.statusPriority
        ))

    if (!candidates.length) {
        return {}
    }

    const current = candidates[0]

    return {
        process: current.process,
        progressPercent: current.progressPercent,
        status: current.status,
    }
}

/**
 * Normalizes challenge type labels for equality checks.
 * @param value Challenge type name, abbreviation, or tag value.
 * @returns Lowercase alphanumeric text with separators removed.
 * Used by `isMarathonMatchChallenge` to compare inconsistent API payload shapes.
 */
function normalizeChallengeTypeToken(value: unknown): string {
    return typeof value === 'string'
        ? value.replace(/[^a-zA-Z0-9]/g, '')
            .toLowerCase()
        : ''
}

/**
 * Returns whether the challenge is a Marathon Match.
 * @param challenge Challenge payload from the challenge API.
 * @returns `true` when the type, type ID, or tags identify Marathon Match.
 * Used by the submissions view to expose marathon-only runner log actions.
 */
export function isMarathonMatchChallenge(
    challenge: Pick<Challenge, 'tags' | 'type' | 'typeId'>,
): boolean {
    const typeName = getChallengeTypeName(challenge.type)
    const typeAbbreviation = typeof challenge.type === 'object'
        ? challenge.type?.abbreviation
        : undefined
    const typeId = typeof challenge.typeId === 'string'
        ? challenge.typeId.trim()
            .toLowerCase()
        : ''
    const typeTokens = [
        typeName,
        typeAbbreviation,
        ...(Array.isArray(challenge.tags)
            ? challenge.tags
            : []),
    ].map(normalizeChallengeTypeToken)

    return typeTokens.includes('marathonmatch')
        || typeTokens.includes('mm')
        || MARATHON_MATCH_TYPE_IDS.has(typeId)
}

export function getStatusText(status?: string, selfService: boolean = false): string {
    const normalizedStatus = normalizeStatus(status)

    if (!normalizedStatus) {
        return '-'
    }

    if (normalizedStatus === CHALLENGE_STATUS.DRAFT) {
        return selfService
            ? 'Waiting for approval'
            : 'Draft'
    }

    if (normalizedStatus.startsWith(CHALLENGE_STATUS.CANCELLED)) {
        return 'Cancelled'
    }

    return startCase(toLower(normalizedStatus))
}

export function getChallengeTypeAbbr(
    typeOrName: string | ChallengeTypeRef | undefined,
    challengeTypes: ChallengeType[] = [],
): string | undefined {
    const typeName = getChallengeTypeName(typeOrName)
    const typeId = typeof typeOrName === 'string'
        ? undefined
        : typeOrName?.id
    const typeAbbreviation = typeof typeOrName === 'string'
        ? undefined
        : typeOrName?.abbreviation
    const type = challengeTypes.find(challengeType => (
        challengeType.name === typeName
        || challengeType.id === typeId
        || challengeType.abbreviation === typeAbbreviation
    ))

    if (type) {
        return type.abbreviation
    }

    return undefined
}

export function is2RoundsChallenge(challenge: Pick<Challenge, 'phases'>): boolean {
    return !!challenge.phases?.find(phase => phase.name === 'Checkpoint Submission')
}

export function getProvisionalScore(submission: ScoredSubmissionLike): number {
    return getSubmissionInitialScore(submission)
}

/**
 * Returns only the provisional marathon score for a submission.
 * @param submission Submission-like object containing legacy phase scores or Review API summations.
 * @returns Provisional score, or `undefined` when provisional scoring has not produced a valid score.
 * Used by marathon submission score display to prefer latest relative summations over stale raw scores.
 */
export function getSubmissionProvisionalScore(
    submission: ScoredSubmissionLike,
): number | undefined {
    const provisionalSummationScore = getScoreFromSummation(
        submission.reviewSummation,
        item => getReviewSummationTestProcess(item) === 'provisional',
    )
    if (provisionalSummationScore !== undefined) {
        return provisionalSummationScore
    }

    const legacyProvisionalScore = toValidScore(
        submission.submissions?.[0]?.provisionalScore,
    )
    if (legacyProvisionalScore !== undefined) {
        return legacyProvisionalScore
    }

    return undefined
}

export function getSubmissionInitialScore(submission: ScoredSubmissionLike): number {
    const initialScoreFromReviews = getAverageScore(
        (submission.review || [])
            .map(review => toValidScore(review.initialScore)),
    )

    if (initialScoreFromReviews !== undefined) {
        return initialScoreFromReviews
    }

    const provisionalSummationScore = getSubmissionProvisionalScore(submission)
    if (provisionalSummationScore !== undefined) {
        return provisionalSummationScore
    }

    const fallbackInitialScore = getAverageScore(
        (submission.review || [])
            .map(review => toValidScore(review.score ?? review.finalScore)),
    )

    return fallbackInitialScore || 0
}

export function getFinalScore(submission: ScoredSubmissionLike): number {
    return getSubmissionFinalScore(submission)
}

/**
 * Returns only the system marathon score for a submission.
 * @param submission Submission-like object containing legacy phase scores or Review API summations.
 * @returns System score, or `undefined` when system scoring has not produced a valid score.
 * Used by marathon submission score display to prefer latest relative summations over stale raw scores.
 */
export function getSubmissionSystemScore(
    submission: ScoredSubmissionLike,
): number | undefined {
    const systemSummationScore = getScoreFromSummation(
        submission.reviewSummation,
        item => getReviewSummationTestProcess(item) === 'system',
    )
    if (systemSummationScore !== undefined) {
        return systemSummationScore
    }

    const legacyFinalScore = toValidScore(
        submission.submissions?.[0]?.finalScore,
    )
    if (legacyFinalScore !== undefined) {
        return legacyFinalScore
    }

    return undefined
}

export function getSubmissionFinalScore(submission: ScoredSubmissionLike): number {
    const finalScoreFromReviews = getAverageScore(
        (submission.review || [])
            .map(review => toValidScore(review.finalScore ?? review.score)),
    )
    if (finalScoreFromReviews !== undefined) {
        return finalScoreFromReviews
    }

    const finalSummationScore = getSubmissionSystemScore(submission)
    if (finalSummationScore !== undefined) {
        return finalSummationScore
    }

    const fallbackSummationScore = getScoreFromSummation(
        submission.reviewSummation,
        () => true,
    )
    if (fallbackSummationScore !== undefined) {
        return fallbackSummationScore
    }

    return 0
}

export function isChallengeCancelled(status?: string): boolean {
    return normalizeStatus(status)
        .startsWith(CHALLENGE_STATUS.CANCELLED)
}

export function isChallengeCompleted(status?: string): boolean {
    return normalizeStatus(status) === CHALLENGE_STATUS.COMPLETED
}

/**
 * Returns whether a challenge is in an end-state that should be treated as read-only in work-manager.
 *
 * @param status challenge status to evaluate
 * @returns `true` when the challenge is completed or any cancelled variant, otherwise `false`
 */
export function isChallengeCompletedOrCancelled(status?: string): boolean {
    return isChallengeCompleted(status) || isChallengeCancelled(status)
}

export function isChallengeActive(status?: string): boolean {
    return normalizeStatus(status) === CHALLENGE_STATUS.ACTIVE
}

export function normalizeChallengeData(challenge: Challenge): Challenge {
    const normalized = {
        ...challenge,
        phases: normalizePhases(challenge.phases || []),
    }

    const legacyTrack = challenge.legacy?.track?.trim()
    if (legacyTrack) {
        normalized.track = legacyTrack
    }

    return normalized
}
