import { ScorecardQuestion } from './ScorecardQuestion.model'

/**
 * Backend model for scorecard question
 */
export interface BackendScorecardQuestion {
    id: string
    legacyId?: string
    scorecardSectionId: string
    type: 'SCALE' | 'YES_NO' | 'TEST_CASE'
    description: string
    guidelines: string
    weight: number
    requiresUpload: boolean
    sortOrder: number
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
    scaleMin: number
    scaleMax: number
}

/**
 * Convert backend scorecard question info to show in ui
 *
 * @param data data from backend response
 * @param index index of data
 * @returns updated data
 */
export function convertBackendScorecardQuestion(
    data: BackendScorecardQuestion,
): ScorecardQuestion {
    return {
        description: data.description,
        guidelines: data.guidelines,
        id: data.id,
        requiresUpload: data.requiresUpload,
        scaleMax: data.scaleMax,
        scaleMin: data.scaleMin,
        sortOrder: data.sortOrder,
        type: data.type,
        weight: data.weight,
    }
}
