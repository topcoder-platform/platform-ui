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

function getScoreFromSummation(
    reviewSummation: ReviewSummation[] | undefined,
    matcher: (entry: ReviewSummation) => boolean,
): number | undefined {
    if (!Array.isArray(reviewSummation) || !reviewSummation.length) {
        return undefined
    }

    const matchedSummation = reviewSummation.find(matcher)

    return toValidScore(matchedSummation?.aggregateScore)
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

export function getSubmissionInitialScore(submission: ScoredSubmissionLike): number {
    const initialScoreFromReviews = getAverageScore(
        (submission.review || [])
            .map(review => toValidScore(review.initialScore)),
    )

    if (initialScoreFromReviews !== undefined) {
        return initialScoreFromReviews
    }

    const legacyProvisionalScore = toValidScore(
        submission.submissions?.[0]?.provisionalScore,
    )
    if (legacyProvisionalScore !== undefined) {
        return legacyProvisionalScore
    }

    const provisionalSummationScore = getScoreFromSummation(
        submission.reviewSummation,
        item => item.isProvisional === true || item.isFinal === false,
    )
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

export function getSubmissionFinalScore(submission: ScoredSubmissionLike): number {
    const finalScoreFromReviews = getAverageScore(
        (submission.review || [])
            .map(review => toValidScore(review.finalScore ?? review.score)),
    )
    if (finalScoreFromReviews !== undefined) {
        return finalScoreFromReviews
    }

    const legacyFinalScore = toValidScore(
        submission.submissions?.[0]?.finalScore,
    )
    if (legacyFinalScore !== undefined) {
        return legacyFinalScore
    }

    const finalSummationScore = getScoreFromSummation(
        submission.reviewSummation,
        item => item.isFinal === true,
    )
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
