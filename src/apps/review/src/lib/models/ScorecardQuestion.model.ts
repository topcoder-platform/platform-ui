/**
 * Scorecard question info
 */
export interface ScorecardQuestion {
    id: string
    type: 'SCALE' | 'YES_NO'
    description: string
    guidelines: string
    weight: number
    scaleMin: number
    scaleMax: number
}
