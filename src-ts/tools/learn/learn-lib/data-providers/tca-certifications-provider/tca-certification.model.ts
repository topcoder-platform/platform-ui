import { TCACertificationLearnLevel } from './tca-certificate-level-type'
import { TCACertificationStatus } from './tca-certificate-status-type'
import { TCACertificationCategory } from './tca-certification-category.model'
import { TcaProviderType } from './tca-provider-type'

export interface TCACertification {
    id: number
    title: string
    certificationCategoryId: string
    coursesCount: number
    dashedName: string
    description: string
    introText: string
    estimatedCompletionTime: number
    learnerLevel: TCACertificationLearnLevel
    certificationCategory: TCACertificationCategory
    stripeProductId?: string
    skills: string[]
    learningOutcomes: string[]
    prerequisites: string[]
    createdAt: Date
    updatedAt: Date
    providers: Array<TcaProviderType>
    sequentialCourses: boolean
    status: TCACertificationStatus
}
