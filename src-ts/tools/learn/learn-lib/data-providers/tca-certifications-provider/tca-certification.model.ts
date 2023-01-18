import { TCACertificationLearnLevel } from './tca-certificate-level-type'
import { TCACertificationStatus } from './tca-certificate-status-type'
import { TcaProviderType } from './tca-provider-type'

export interface TCACertification {
    id: number
    title: string
    dashedName: string
    description: string
    estimatedCompletionTime: number
    introText: string
    status: TCACertificationStatus
    requirements: Array<string>
    sequentialCourses: boolean
    learnerLevel: TCACertificationLearnLevel
    certificationCategoryId: string
    coursesCount: number
    stripeProductId?: string
    skills: string[]
    providers: Array<TcaProviderType>
}
