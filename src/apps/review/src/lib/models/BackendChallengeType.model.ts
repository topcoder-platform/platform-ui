/**
 * Backend response for challenge type
 */
export interface BackendChallengeType {
    id: string
    name: string
    description: string
    isActive: boolean
    isTask: boolean
    abbreviation: string
}
