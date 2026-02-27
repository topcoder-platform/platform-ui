import moment from 'moment'

import type { BackendSubmission } from './BackendSubmission.model'
import { ChallengeInfo, ChallengeTrack, ChallengeType } from './ChallengeInfo.model'

export interface BackendChallengeType {
    abbreviation?: string
    id?: string
    name: string
}

export interface BackendChallengeTrack {
    abbreviation?: string
    id?: string
    name: string
    track?: string
}

export interface BackendChallengePhase {
    actualEndDate?: string
    actualStartDate?: string
    constraints?: Array<Record<string, unknown>>
    description?: string
    duration?: number
    id: string
    isOpen?: boolean
    name: string
    phaseId?: string
    predecessor?: string
    scheduledEndDate?: string
    scheduledStartDate?: string
}

export interface BackendChallengePrize {
    [key: string]: unknown
}

export interface BackendChallengePrizeSet {
    description?: string
    prizes: BackendChallengePrize[]
    type: string
}

export interface BackendChallengeTerm {
    id: string
    roleId?: string
}

export interface BackendChallengeWinner {
    handle?: string
    maxRating?: number | null
    placement?: number
    type?: string
    userId?: number
}

export interface BackendRegistrant {
    countryCode?: string
    countryFlag?: string
    created: string
    memberHandle: string
    rating?: number
    submissionDate?: string
}

export interface BackendCheckpointResult {
    expanded?: boolean
    feedback?: string
    submissionId: string
}

export interface BackendChallengeCheckpoints {
    checkpointResults: BackendCheckpointResult[]
    generalFeedback?: string
    numberOfPassedScreeningSubmissions?: number
}

export interface BackendDiscussion {
    id?: string
    name?: string
    provider?: string
    type?: string
    url?: string
}

export interface BackendChallengeLegacy {
    [key: string]: unknown
    wiproAllowed?: boolean
}

/**
 * Raw challenge data from challenge-api-v6.
 */
export interface BackendChallengeInfo {
    checkpoints?: BackendChallengeCheckpoints
    currentPhase?: BackendChallengePhase
    description: string
    descriptionFormat: string
    discussions: BackendDiscussion[]
    events?: Array<{ eventName: string }>
    endDate?: string
    funChallenge?: boolean
    id: string
    isRegistered?: boolean
    legacy: BackendChallengeLegacy
    legacyId?: number
    metadata: Record<string, unknown>
    name: string
    numOfCheckpointSubmissions: number
    numOfRegistrants: number
    numOfSubmissions: number
    phases: BackendChallengePhase[]
    privateDescription?: string
    prizeSets: BackendChallengePrizeSet[]
    registrants?: BackendRegistrant[]
    registrationEndDate: string
    registrationStartDate: string
    reliabilityBonus?: number
    round1Introduction?: string
    round2Introduction?: string
    roundId?: string
    skills?: Array<{ name: string }>
    startDate: string
    status: string
    submissions?: BackendSubmission[]
    submissionEndDate: string
    submissionStartDate: string
    tags: string[]
    terms: BackendChallengeTerm[]
    track: string | BackendChallengeTrack
    trackId: string
    type: string | BackendChallengeType
    typeId: string
    userDetails?: { roles: string[] }
    winners: BackendChallengeWinner[]
    groups: Array<Record<string, unknown>>
}

const TABLE_DATE_FORMAT = 'MMM DD YYYY, HH:mm A'

function normalizeTrack(
    track: BackendChallengeInfo['track'],
    trackId: string,
): ChallengeTrack {
    if (typeof track === 'object') {
        return {
            abbreviation: track.abbreviation,
            id: track.id ?? trackId,
            name: track.name,
            track: track.track,
        }
    }

    return {
        id: trackId,
        name: track,
    }
}

function normalizeType(
    type: BackendChallengeInfo['type'],
    typeId: string,
): ChallengeType {
    if (typeof type === 'object') {
        return {
            abbreviation: type.abbreviation,
            id: type.id ?? typeId,
            name: type.name,
        }
    }

    return {
        id: typeId,
        name: type,
    }
}

function resolveCurrentPhaseEndDate(
    currentPhase?: BackendChallengePhase,
): string | undefined {
    if (!currentPhase) {
        return undefined
    }

    return currentPhase.actualEndDate ?? currentPhase.scheduledEndDate
}

function toTimeLeftString(currentPhaseEndDate?: string): string | undefined {
    if (!currentPhaseEndDate) {
        return undefined
    }

    const targetDate = new Date(currentPhaseEndDate)
    const diff = targetDate.getTime() - Date.now()

    if (!Number.isFinite(diff) || diff <= 0) {
        return 'Ended'
    }

    const hourMs = 60 * 60 * 1000
    const dayMs = 24 * hourMs
    const minuteMs = 60 * 1000

    if (diff >= dayMs) {
        const days = Math.floor(diff / dayMs)
        const hours = Math.floor((diff % dayMs) / hourMs)

        return `${days}d ${hours}h`
    }

    if (diff >= hourMs) {
        const hours = Math.floor(diff / hourMs)
        const minutes = Math.floor((diff % hourMs) / minuteMs)

        return `${hours}h ${minutes}m`
    }

    const minutes = Math.max(Math.floor(diff / minuteMs), 1)
    return `${minutes}m`
}

/**
 * Converts backend challenge data into a frontend challenge model.
 *
 * @param data Raw challenge data from challenge-api-v6.
 * @param index Optional positional index for list rendering.
 * @returns Converted challenge data.
 */
export function convertBackendChallengeInfo(
    data: BackendChallengeInfo | undefined,
    index?: number,
): ChallengeInfo | undefined {
    if (!data) {
        return data
    }

    const currentPhaseEndDate = resolveCurrentPhaseEndDate(data.currentPhase)

    return {
        ...data,
        checkpoints: data.checkpoints,
        currentPhaseEndDateString: currentPhaseEndDate
            ? moment(currentPhaseEndDate)
                .local()
                .format(TABLE_DATE_FORMAT)
            : undefined,
        discussionsUrl: data.discussions[0]?.url,
        events: data.events,
        funChallenge: data.funChallenge,
        index,
        isRegistered: data.isRegistered,
        isWiproAllowed: data.legacy?.wiproAllowed !== false,
        privateDescription: data.privateDescription,
        registrants: data.registrants,
        reliabilityBonus: data.reliabilityBonus,
        round1Introduction: data.round1Introduction,
        round2Introduction: data.round2Introduction,
        roundId: data.roundId,
        skills: data.skills,
        submissions: data.submissions?.map(submission => ({
            ...submission,
        })),
        timeLeft: toTimeLeftString(currentPhaseEndDate),
        track: normalizeTrack(data.track, data.trackId),
        type: normalizeType(data.type, data.typeId),
        userDetails: data.userDetails,
    }
}
