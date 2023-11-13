import { TCACertificationLearnLevel } from './tca-certificate-level-type'
import { TCACertificationStatus } from './tca-certificate-status-type'
import { TCACertificationCategory } from './tca-certification-category.model'
import { TCACertificationCompletionTimeRange } from './tca-certification-completion-time-range.model'
import { TCACertificationProvider } from './tca-certification-provider.model'
import { TCACertificationProviderBase } from './tca-certification-provider.model-base'
import { TCACertificationResource } from './tca-certification-resource.model'
import { TCASkillType } from './tca-skill-type'

export interface TCACertification {
    certificationCategory: TCACertificationCategory
    certificationCategoryId: string
    certificationResources: Array<TCACertificationResource>
    completionTimeRange: TCACertificationCompletionTimeRange
    coursesCount: number
    createdAt: Date
    dashedName: string
    description: string
    id: number
    introText: string
    learnerLevel: TCACertificationLearnLevel
    learnedOutcomes: string[]
    learningOutcomes: string[]
    prerequisites: string[]
    providers: Array<TCACertificationProviderBase>
    resourceProviders: Array<TCACertificationProvider>
    sequentialCourses: boolean
    skills: Array<TCASkillType>
    status: TCACertificationStatus
    stripeProductId?: string
    title: string
    updatedAt: Date
}
