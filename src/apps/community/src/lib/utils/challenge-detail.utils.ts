import { EnvironmentConfig } from '~/config'

import {
    type BackendChallengePhase,
    type BackendChallengePrize,
    type BackendChallengeWinner,
    ChallengeInfo,
} from '../models'

export interface PlacementPrize extends BackendChallengePrize {
    type?: string
    value: number
}

function getChallengeTypeName(challenge: ChallengeInfo): string {
    if (typeof challenge.type === 'string') {
        return challenge.type
    }

    return challenge.type?.name ?? ''
}

function getForumId(challenge: ChallengeInfo): number {
    const forumId = challenge.legacy?.forumId
    const parsed = Number(forumId)

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 0
    }

    return parsed
}

/**
 * Checks whether registration should be blocked for Wipro emails.
 *
 * @param email Current member email.
 * @param isWiproAllowed Challenge-level Wipro override.
 * @returns True when registration should be blocked.
 */
export function isWiproRegistrationBlocked(
    email: string | undefined,
    isWiproAllowed: boolean | undefined,
): boolean {
    if (isWiproAllowed !== false) {
        return false
    }

    return /@wipro\.com$/i.test((email ?? '').trim())
}

/**
 * Returns winners to show in the Winners tab.
 *
 * @param challenge Challenge details.
 * @returns Filtered winner list.
 */
export function getDisplayWinners(challenge: ChallengeInfo): BackendChallengeWinner[] {
    const winners = challenge.winners ?? []
    const typeName = getChallengeTypeName(challenge)

    if (typeName === 'Task') {
        return winners
    }

    return winners.filter(winner => {
        const winnerType = winner.type?.toLowerCase()
        return winner.type === undefined || winnerType === 'final'
    })
}

/**
 * Returns non-zero placement prizes for the challenge.
 *
 * @param challenge Challenge details.
 * @returns Placement prize list.
 */
export function getPlacementPrizes(challenge: ChallengeInfo): PlacementPrize[] {
    const placementSet = challenge.prizeSets.find(
        prizeSet => prizeSet.type.toLowerCase() === 'placement',
    )

    if (!placementSet) {
        return []
    }

    return placementSet.prizes.filter(prize => {
        const value = Number((prize as PlacementPrize).value)
        return Number.isFinite(value) && value > 0
    })
        .map(prize => ({
            ...(prize as PlacementPrize),
            value: Number((prize as PlacementPrize).value),
        }))
}

/**
 * Determines whether the challenge is a Marathon Match.
 *
 * @param challenge Challenge details.
 * @returns True when challenge is a Marathon Match.
 */
export function isMarathonMatch(challenge: ChallengeInfo): boolean {
    if (challenge.legacy?.subTrack === 'MARATHON_MATCH') {
        return true
    }

    return getChallengeTypeName(challenge) === 'Marathon Match'
}

/**
 * Checks if there is an open Submission phase.
 *
 * @param phases Challenge phases.
 * @returns True when an open Submission phase exists.
 */
export function hasOpenSubmissionPhase(
    phases: BackendChallengePhase[] | undefined,
): boolean {
    if (!phases?.length) {
        return false
    }

    return phases.some(phase => phase.name === 'Submission' && phase.isOpen === true)
}

/**
 * Determines whether a challenge is in the Design track.
 *
 * @param challenge Challenge details.
 * @returns True for design challenges.
 */
export function isDesignChallenge(challenge: ChallengeInfo): boolean {
    return challenge.track.name.toLowerCase() === 'design'
}

/**
 * Resolves the challenge forum/discussion URL.
 *
 * @param challenge Challenge details.
 * @returns Discussion URL when available.
 */
export function getForumLink(challenge: ChallengeInfo): string | undefined {
    if (challenge.discussionsUrl) {
        return challenge.discussionsUrl
    }

    const forumId = getForumId(challenge)

    if (!forumId) {
        return undefined
    }

    const path = isDesignChallenge(challenge)
        ? `/?module=ThreadList&forumID=${forumId}`
        : `/?module=Category&categoryID=${forumId}`

    return `${EnvironmentConfig.ADMIN.ONLINE_REVIEW_URL}${path}`
}
