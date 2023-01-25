import { TCACertificationLearnLevel } from './tca-certificate-level-type'
import { TCACertificationStatus } from './tca-certificate-status-type'
import { TCACertificationCategory } from './tca-certification-category.model'
import { TcaProviderType } from './tca-provider-type'

export interface TCACertification {
    certificationCategory: TCACertificationCategory
    certificationCategoryId: string
    coursesCount: number
    createdAt: Date
    dashedName: string
    description: string
    estimatedCompletionTime: number
    id: number
    introText: string
    learnerLevel: TCACertificationLearnLevel
    learningOutcomes: string[]
    prerequisites: string[]
    providers: Array<TcaProviderType>
    sequentialCourses: boolean
    skills: string[]
    status: TCACertificationStatus
    stripeProductId?: string
    title: string
    updatedAt: Date
}
