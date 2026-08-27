import { UserStats } from '~/libs/core'

import {
    ChallengeCatalogValue,
    ChallengeProjectResult,
} from '../models'

export interface ChallengeWinnerIdentity {
    handle?: string
    placement?: number
    userId?: string
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
 * Normalizes an API identity without changing numeric member IDs.
 *
 * @param value member or submission identity candidate.
 * @returns trimmed identifier, or an empty string.
 * @throws Does not throw.
 */
function normalizedIdentifier(value: unknown): string {
    return value === undefined || value === null ? '' : String(value)
        .trim()
}

/**
 * Reads a positive integer placement from Challenge or Review API data.
 *
 * @param value placement candidate.
 * @returns normalized placement, or undefined.
 * @throws Does not throw.
 */
function normalizedPlacement(value: unknown): number | undefined {
    const placement = Number(value)
    return Number.isInteger(placement) && placement > 0 ? placement : undefined
}

/**
 * Resolves a winner's final score from Review API's canonical project result.
 * Both member ID and placement must match, preventing a sibling submission or
 * a same-placement record from being attributed to the wrong winner.
 *
 * @param winner Challenge API winner identity.
 * @param projectResults authorized Review API final-placement results.
 * @returns canonical finite final score, or undefined.
 * @throws Does not throw.
 */
export function winnerFinalScore(
    winner: ChallengeWinnerIdentity,
    projectResults: ChallengeProjectResult[],
): number | undefined {
    const winnerId = normalizedIdentifier(winner.userId)
    const winnerPlacement = normalizedPlacement(winner.placement)
    if (!winnerId || winnerPlacement === undefined) return undefined
    const result = projectResults.find(candidate => (
        normalizedIdentifier(candidate.userId) === winnerId
        && normalizedPlacement(candidate.placement) === winnerPlacement
    ))
    return result ? finiteNumber(result.finalScore) : undefined
}
