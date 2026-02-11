export interface Prize {
    description?: string
    type: 'USD' | 'POINT'
    value: number
}

export interface PrizeSet {
    description?: string
    prizes: Prize[]
    type: string
}

export const PLACEMENT = 'PLACEMENT'
export const COPILOT = 'COPILOT'
export const REVIEWER = 'REVIEWER'
export const CHECKPOINT = 'CHECKPOINT'
