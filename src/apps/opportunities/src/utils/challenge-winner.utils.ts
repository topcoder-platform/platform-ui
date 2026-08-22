import { UserStats } from '~/libs/core'

import {
    ChallengeCatalogValue,
    ChallengeReviewSummation,
    ChallengeSubmission,
} from '../models'

import { marathonSubmissionScores } from './marathon-match.utils'

export interface ChallengeWinnerIdentity {
    handle?: string
    placement?: number
    userId?: string
}

/**
 * Normalizes catalog and identity labels for tolerant API comparisons.
 *
 * @param value unknown catalog or identity field.
 * @returns trimmed lowercase string, or an empty string.
 * @throws Does not throw.
 */
function normalized(value: unknown): string {
    return typeof value === 'string'
        ? value.trim()
            .toLowerCase()
        : ''
}

/**
 * Reads a finite public counter without coercing missing values to zero.
 *
 * @param value candidate Members API counter.
 * @returns finite number, or undefined.
 * @throws Does not throw.
 */
function finiteNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
}

/**
 * Reads a catalog name from either Challenge API response shape.
 *
 * @param value string or expanded challenge catalog value.
 * @returns trimmed catalog label with a generic challenge fallback.
 * @throws Does not throw.
 */
export function challengeTrackLabel(value?: ChallengeCatalogValue): string {
    const name = typeof value === 'string' ? value : value?.name ?? value?.track
    return name?.trim() || 'challenge'
}

/**
 * Selects the winner's real first-place count for the challenge track from
 * Members API stats, falling back only to the API's aggregate win count.
 *
 * @param stats public Members API statistics.
 * @param track challenge track in either API response shape.
 * @returns track-specific or aggregate win count, or undefined.
 * @throws Does not throw.
 */
export function challengeTrackWins(
    stats: UserStats | undefined,
    track?: ChallengeCatalogValue,
): number | undefined {
    if (!stats) return undefined
    const trackKey = challengeTrackLabel(track)
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase()
    let trackWins: unknown
    if (trackKey === 'development' || trackKey === 'develop') {
        trackWins = stats.DEVELOP?.wins
    } else if (trackKey === 'design') {
        trackWins = stats.DESIGN?.wins
    } else if (trackKey === 'datascience') {
        trackWins = stats.DATA_SCIENCE?.wins
    } else if (trackKey === 'qualityassurance' || trackKey === 'qa') {
        trackWins = stats.QA?.wins
    } else if (trackKey === 'ai' || trackKey === 'artificialintelligence') {
        trackWins = stats.AI_ENGINEERING?.wins ?? stats.AI_ENGINEER?.wins ?? stats.AI?.wins
    }

    return finiteNumber(trackWins) ?? finiteNumber(stats.wins)
}

/**
 * Matches a public latest submission to a Challenge API winner.
 *
 * @param submission Review API submission row.
 * @param winner Challenge API winner identity.
 * @returns true when ID, handle, or placement identifies the same member.
 * @throws Does not throw.
 */
function submissionBelongsToWinner(
    submission: ChallengeSubmission,
    winner: ChallengeWinnerIdentity,
): boolean {
    const winnerId = String(winner.userId ?? '')
        .trim()
    const winnerHandle = normalized(winner.handle)
    const submissionIds = [
        submission.memberId,
        submission.registrant?.userId,
        submission.createdBy,
    ].map(value => String(value ?? '')
        .trim())
    const submissionHandles = [
        submission.submitterHandle,
        submission.memberHandle,
        submission.registrant?.memberHandle,
        submission.registrant?.handle,
        submission.createdBy,
    ].map(normalized)
    if (winnerId && submissionIds.includes(winnerId)) return true
    if (winnerHandle && submissionHandles.includes(winnerHandle)) return true
    return winner.placement !== undefined
        && submission.placement !== undefined
        && Number(submission.placement) === Number(winner.placement)
}

/**
 * Matches one Review Summation aggregate to a Challenge API winner.
 *
 * @param summation Review API aggregate score row.
 * @param winner Challenge API winner identity.
 * @returns true when member ID or handle identifies the same member.
 * @throws Does not throw.
 */
function summationBelongsToWinner(
    summation: ChallengeReviewSummation,
    winner: ChallengeWinnerIdentity,
): boolean {
    const winnerId = String(winner.userId ?? '')
        .trim()
    const submitterIds = [summation.submitterId, summation.memberId]
        .map(value => String(value ?? '')
            .trim())
    if (winnerId && submitterIds.includes(winnerId)) return true
    const winnerHandle = normalized(winner.handle)
    return !!winnerHandle && normalized(summation.submitterHandle) === winnerHandle
}

/**
 * Resolves a winner's best available final score. Public latest submissions
 * are authoritative; Review Summations supply the fallback when those rows do
 * not yet expose their scorer aggregate.
 *
 * @param winner Challenge API winner identity.
 * @param submissions public latest submission rows.
 * @param reviewSummations challenge-level aggregate score rows.
 * @returns best available final score, or undefined.
 * @throws Does not throw.
 */
export function winnerFinalScore(
    winner: ChallengeWinnerIdentity,
    submissions: ChallengeSubmission[],
    reviewSummations: ChallengeReviewSummation[],
): number | undefined {
    const submissionScore = submissions
        .filter(submission => submissionBelongsToWinner(submission, winner))
        .map(submission => marathonSubmissionScores(submission).finalScore)
        .find((score): score is number => score !== undefined)
    if (submissionScore !== undefined) return submissionScore

    const matchingSummations = reviewSummations
        .filter(summation => summationBelongsToWinner(summation, winner))
    if (!matchingSummations.length) return undefined
    return marathonSubmissionScores({
        id: `winner-${winner.userId ?? winner.handle ?? winner.placement ?? 'unknown'}`,
        reviewSummation: matchingSummations,
    }).finalScore
}
