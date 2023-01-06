import { TCACertificationLearnLevel } from './tca-certificate-level-type'
import { TCACertificationStatus } from './tca-certificate-status-type'

export interface TCACertification {
    id: number
    title: string
    description: string
    estimatedCompletionTime: number
    status: TCACertificationStatus
    sequentialCourses: boolean
    learnerLevel: TCACertificationLearnLevel
    certificationCategoryId: string
    stripeProductId?: string
    skills: string[]
}
