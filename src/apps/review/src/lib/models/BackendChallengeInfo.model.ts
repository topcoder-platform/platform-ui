import moment from 'moment'

import { formatDurationDate } from '../utils'
import { SUBMISSION_TYPE_CONTEST } from '../constants'
import { TABLE_DATE_FORMAT } from '../../config/index.config'

import { BackendMetadata } from './BackendMetadata.model'
import { ChallengeInfo, ChallengeTrack, ChallengeType, ChallengeWinner } from './ChallengeInfo.model'
import { BackendPhase } from './BackendPhase.model'
import { BackendDiscussion } from './BackendDiscussion.model'
import { BackendPrizeSet } from './BackendPrizeSet.model'
import { BackendTerm } from './BackendTerm.model'
import { BackendSkill } from './BackendSkill.model'
import { BackendLegacy } from './BackendLegacy.model'
import { BackendTask } from './BackendTask.model'
import { BackendOverview } from './BackendOverview.model'

export interface BackendChallengeWinner {
    userId: number
    handle: string
    placement: number
    type?: string
    maxRating?: number | null
}

/**
 * Backend response for challenge info
 */
export interface BackendChallengeInfo {
    id: string
    name: string
    description: string
    descriptionFormat: string
    projectId: number
    typeId: string
    trackId: string
    timelineTemplateId: string
    currentPhaseNames: string[]
    tags: string[]
    groups: any[]
    submissionStartDate: string
    submissionEndDate: string
    registrationStartDate: string
    registrationEndDate: string
    startDate: string
    endDate?: string
    legacyId?: number
    status: string
    createdBy: string
    updatedBy: string
    metadata: BackendMetadata[]
    phases: BackendPhase[]
    discussions: BackendDiscussion[]
    prizeSets: BackendPrizeSet[]
    terms: BackendTerm[]
    skills: BackendSkill[]
    // type/track may be string (legacy) or object (new)
    track: string | { id: string; name: string; abbreviation?: string; track?: string }
    type: string | { id: string; name: string; abbreviation?: string }
    legacy: BackendLegacy
    task: BackendTask
    created: string
    updated: string
    overview: BackendOverview
    numOfSubmissions: number
    numOfCheckpointSubmissions: number
    numOfRegistrants: number
    currentPhase?: BackendPhase
    winners?: BackendChallengeWinner[] | null
}

function normalizeType(
    type: BackendChallengeInfo['type'],
    typeId: string,
): ChallengeType {
    if (typeof type === 'object') {
        return {
            abbreviation: (type as any).abbreviation,
            id: (type as any).id ?? typeId,
            name: (type as any).name,
        }
    }

    return {
        id: typeId,
        name: type as unknown as string,
    }
}

function normalizeTrack(
    track: BackendChallengeInfo['track'],
    trackId: string,
): ChallengeTrack {
    if (typeof track === 'object') {
        return {
            abbreviation: (track as any).abbreviation,
            id: (track as any).id ?? trackId,
            name: (track as any).name,
            track: (track as any).track,
        }
    }

    return {
        id: trackId,
        name: track as unknown as string,
    }
}

function mapWinners(
    winners: BackendChallengeInfo['winners'],
): ChallengeWinner[] | undefined {
    if (!winners) {
        return undefined
    }

    // Only expose contest submissions in the winners list
    const contestWinners = winners.filter(winner => (
        (winner.type ?? SUBMISSION_TYPE_CONTEST) === SUBMISSION_TYPE_CONTEST
    ))

    return contestWinners.map(winner => ({
        handle: winner.handle,
        maxRating: winner.maxRating ?? undefined,
        placement: winner.placement,
        type: winner.type,
        userId: winner.userId,
    }))
}

/**
 * Convert backend challenge info to show in ui
 *
 * @param data data from backend response
 * @param index index of data
 * @returns updated data
 */
export function convertBackendChallengeInfo(
    data: BackendChallengeInfo | undefined,
    index?: number,
): ChallengeInfo | undefined {
    if (!data) {
        return data
    }

    const currentPhaseEndDate
        = data.currentPhase?.actualEndDate
        ?? (data.currentPhase?.scheduledEndDate as string)
    const currentPhaseEndDateObject: undefined | Date = currentPhaseEndDate
        ? new Date(currentPhaseEndDate)
        : undefined
    const timeLeft = currentPhaseEndDateObject
        ? formatDurationDate(currentPhaseEndDateObject, new Date())
        : {
            durationColor: undefined,
            durationStatus: undefined,
            durationString: undefined,
        }
    const currentPhaseEndDateString = currentPhaseEndDateObject
        ? moment(currentPhaseEndDateObject)
            .local()
            .format(TABLE_DATE_FORMAT)
        : undefined
    const currentPhase = data.currentPhase?.name ?? ''
    const challengeEndDateObject: Date | undefined = data.endDate
        ? new Date(data.endDate)
        : undefined
    const challengeEndDateString = challengeEndDateObject
        ? moment(challengeEndDateObject)
            .local()
            .format(TABLE_DATE_FORMAT)
        : undefined

    const winners: ChallengeWinner[] | undefined = mapWinners(data.winners)

    // normalize type/track to objects
    const normalizedType: ChallengeType = normalizeType(data.type, data.typeId)
    const normalizedTrack: ChallengeTrack = normalizeTrack(data.track, data.trackId)

    return {
        ...data,
        currentPhase,
        currentPhaseEndDate,
        currentPhaseEndDateString,
        currentPhaseObject: data.currentPhase,
        discussionsUrl: data.discussions[0]?.url,
        endDate: challengeEndDateObject ?? data.endDate,
        endDateString: challengeEndDateString,
        id: data.id,
        index,
        legacyId: data.legacyId,
        name: data.name,
        phases: data.phases,
        prizeSets: data.prizeSets,
        reviewLength: 0,
        // the % = (The number of submission has been reviewed / submitted review) / The total number of submissions.
        // For now, we can skip the review process.
        // We'll handle it later once we've integrated the APIs for the Challenge
        // Review Details and Challenge Review Edit pages
        reviewProgress: 13, // show some dummy data
        submissions: [],
        timeLeft: timeLeft.durationString,
        timeLeftColor: timeLeft.durationColor,
        timeLeftStatus: timeLeft.durationStatus,
        track: normalizedTrack,
        type: normalizedType,
        typeId: data.typeId,
        winners,
    }
}
