import { ScorecardQuestion } from './ScorecardQuestion.model'

/**
 * Scorcard section info
 */
export interface ScorecardSection {
    id: string
    name: string
    weight: number
    sortOrder: number
    questions: ScorecardQuestion[]
}
