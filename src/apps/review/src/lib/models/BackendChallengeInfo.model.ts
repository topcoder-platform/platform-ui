import moment from 'moment'

import { formatDurationDate } from '../utils'
import { TABLE_DATE_FORMAT } from '../../config/index.config'

import { BackendMetadata } from './BackendMetadata.model'
import { ChallengeInfo, ChallengeType } from './ChallengeInfo.model'
import { BackendPhase } from './BackendPhase.model'
import { BackendDiscussion } from './BackendDiscussion.model'
import { BackendPrizeSet } from './BackendPrizeSet.model'
import { BackendTerm } from './BackendTerm.model'
import { BackendSkill } from './BackendSkill.model'
import { BackendLegacy } from './BackendLegacy.model'
import { BackendTask } from './BackendTask.model'
import { BackendOverview } from './BackendOverview.model'

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
    track: string
    type: string
    legacy: BackendLegacy
    task: BackendTask
    created: string
    updated: string
    overview: BackendOverview
    numOfSubmissions: number
    numOfCheckpointSubmissions: number
    numOfRegistrants: number
    currentPhase?: BackendPhase
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
        track: data.track as ChallengeType,
        type: data.type as ChallengeType,
        typeId: data.typeId,
    }
}
