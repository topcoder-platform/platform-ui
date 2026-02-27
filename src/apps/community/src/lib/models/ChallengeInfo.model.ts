import type {
    BackendChallengeCheckpoints,
    BackendChallengeInfo,
    BackendRegistrant,
} from './BackendChallengeInfo.model'
import type { SubmissionInfo } from './SubmissionInfo.model'

/**
 * Normalized challenge type.
 */
export interface ChallengeType {
    abbreviation?: string
    id: string
    name: string
}

/**
 * Normalized challenge track.
 */
export interface ChallengeTrack {
    abbreviation?: string
    id: string
    name: string
    track?: string
}

/**
 * Challenge data consumed by the community app.
 */
export interface ChallengeInfo extends Omit<BackendChallengeInfo, 'track' | 'type'> {
    checkpoints?: BackendChallengeCheckpoints
    currentPhaseEndDateString?: string
    discussionsUrl?: string
    events?: Array<{ eventName: string }>
    funChallenge?: boolean
    index?: number
    isRegistered?: boolean
    isWiproAllowed: boolean
    privateDescription?: string
    registrants?: BackendRegistrant[]
    reliabilityBonus?: number
    round1Introduction?: string
    round2Introduction?: string
    roundId?: string
    skills?: Array<{ name: string }>
    submissions?: SubmissionInfo[]
    timeLeft?: string
    track: ChallengeTrack
    type: ChallengeType
    userDetails?: { roles: string[] }
}
