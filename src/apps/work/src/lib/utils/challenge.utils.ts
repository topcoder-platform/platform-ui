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

function getScoreFromSummation(
    reviewSummation: ReviewSummation[] | undefined,
    type: 'final' | 'provisional',
): number {
    if (!Array.isArray(reviewSummation) || !reviewSummation.length) {
        return 0
    }

    const matchedSummation = reviewSummation.find(item => (
        type === 'final'
            ? item.isFinal
            : item.isProvisional
    ))

    const score = Number(matchedSummation?.aggregateScore)

    return Number.isFinite(score) && score >= 0
        ? score
        : 0
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
    const legacyProvisionalScore = Number(submission.submissions?.[0]?.provisionalScore)

    if (Number.isFinite(legacyProvisionalScore) && legacyProvisionalScore >= 0) {
        return legacyProvisionalScore
    }

    return getScoreFromSummation(submission.reviewSummation, 'provisional')
}

export function getFinalScore(submission: ScoredSubmissionLike): number {
    const legacyFinalScore = Number(submission.submissions?.[0]?.finalScore)

    if (Number.isFinite(legacyFinalScore) && legacyFinalScore >= 0) {
        return legacyFinalScore
    }

    const summationScore = getScoreFromSummation(submission.reviewSummation, 'final')

    if (summationScore > 0) {
        return summationScore
    }

    const reviewScore = Number(submission.review?.[0]?.finalScore ?? submission.review?.[0]?.score)

    if (Number.isFinite(reviewScore) && reviewScore >= 0) {
        return reviewScore
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
