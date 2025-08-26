/**
 * Scorecard question info
 */
export interface ScorecardQuestion {
    id: string
    type: 'SCALE' | 'YES_NO' | 'TEST_CASE'
    description: string
    guidelines: string
    weight: number
    scaleMin: number
    scaleMax: number
    requiresUpload: boolean
}
