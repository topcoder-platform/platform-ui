import {
    BackendScorecardQuestion,
    convertBackendScorecardQuestion,
} from './BackendScorecardQuestion.model'
import { ScorecardSection } from './ScorecardSection.model'

/**
 * Backend model for scorecard section
 */
export interface BackendScorecardSectionBase {
    id: string
    legacyId?: string
    scorecardGroupId: string
    name: string
    weight: number
    sortOrder: number
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
}

export interface BackendScorecardSection extends BackendScorecardSectionBase {
    questions: BackendScorecardQuestion[]
}

/**
 * Convert backend scorecard section info to show in ui
 *
 * @param data data from backend response
 * @param index index of data
 * @returns updated data
 */
export function convertBackendScorecardSection(
    data: BackendScorecardSection,
): ScorecardSection {
    return {
        id: data.id,
        name: data.name,
        questions: data.questions.map(convertBackendScorecardQuestion),
        sortOrder: data.sortOrder,
        weight: data.weight,
    }
}
