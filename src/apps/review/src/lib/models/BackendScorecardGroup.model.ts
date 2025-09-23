import {
    BackendScorecardSection,
    convertBackendScorecardSection,
} from './BackendScorecardSection.model'
import { adjustScorecardGroup, ScorecardGroup } from './ScorecardGroup.model'

/**
 * Backend model for scorecard group
 */
export interface BackendScorecardGroupBase {
    id: string
    legacyId?: string
    scorecardId: string
    name: string
    weight: number
    sortOrder: number
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
}

export interface BackendScorecardGroup extends BackendScorecardGroupBase {
    sections: BackendScorecardSection[]
}

/**
 * Convert backend scorecard group info to show in ui
 *
 * @param data data from backend response
 * @param index index of data
 * @returns updated data
 */
export function convertBackendScorecardGroup(
    data: BackendScorecardGroup,
): ScorecardGroup {
    return adjustScorecardGroup({
        id: data.id,
        name: data.name,
        sections: data.sections.map(convertBackendScorecardSection),
        sortOrder: data.sortOrder,
        weight: data.weight,
    })
}
