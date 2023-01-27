import { TCACertificationLearnLevel } from './tca-certificate-level-type'
import { TCACertificationStatus } from './tca-certificate-status-type'
import { TCACertificationCategory } from './tca-certification-category.model'
import { TCACertificationProvider } from './tca-certification-provider.model'
import { TCACertificationProviderBase } from './tca-certification-provider.model-base'
import { TCACertificationResource } from './tca-certification-resource.model'

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
    stripeProductId?: string
    skills: string[]
    learningOutcomes: string[]
    prerequisites: string[]
    createdAt: Date
    updatedAt: Date
    certificationResources: Array<TCACertificationResource>
    certificationCategory: TCACertificationCategory
    resourceProviders: Array<TCACertificationProvider>
    coursesCount: number
    providers: Array<TCACertificationProviderBase>
}
