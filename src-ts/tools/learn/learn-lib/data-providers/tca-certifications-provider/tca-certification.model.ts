import { TCACertificationLearnLevel } from './tca-certificate-level-type'
import { TCACertificationStatus } from './tca-certificate-status-type'
import { TCACertificationCategory } from './tca-certification-category.model'

export interface TCACertification {
    id: number
    title: string
    dashedName: string
    description: string
    introText: string
    estimatedCompletionTime: number
    status: TCACertificationStatus
    sequentialCourses: boolean
    learnerLevel: TCACertificationLearnLevel
    certificationCategoryId: string
    certificationCategory: TCACertificationCategory
    stripeProductId?: string
    skills: string[]
    learningOutcomes: string[]
    prerequisites: string[]
    createdAt: Date
    updatedAt: Date
}
