import {
    BackendScorecardGroup,
    convertBackendScorecardGroup,
} from './BackendScorecardGroup.model'
import { adjustScorecardInfo, ScorecardInfo } from './ScorecardInfo.model'

/**
 * Backend model for scorecard
 */
export type BackendScorecardStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED'
export type BackendScorecardType =
    | 'SCREENING'
    | 'REVIEW'
    | 'APPROVAL'
    | 'POST_MORTEM'
    | 'SPECIFICATION_REVIEW'
    | 'CHECKPOINT_SCREENING'
    | 'CHECKPOINT_REVIEW'
    | 'ITERATIVE_REVIEW'
export interface BackendScorecardBase {
    status: BackendScorecardStatus
    legacyId: string
    type: BackendScorecardType
    challengeTrack: string
    challengeType: string
    name: string
    version: string
    minScore: number
    maxScore: number
    minimumPassingScore: number | null
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
}

export interface BackendScorecard extends BackendScorecardBase {
    id: string
    scorecardGroups: BackendScorecardGroup[]
}

/**
 * Convert backend scorecard info to show in ui
 *
 * @param data data from backend response
 * @param index index of data
 * @returns updated data
 */
export function convertBackendScorecard(data: BackendScorecard): ScorecardInfo {
    return adjustScorecardInfo({
        id: data.id,
        name: data.name,
        scorecardGroups: data.scorecardGroups.map(convertBackendScorecardGroup),
    })
}
