import { TCACertificationLearnLevel } from './tca-certificate-level-type'
import { TCACertificationStatus } from './tca-certificate-status-type'
import { TcaCertificateType } from './tca-certificate-type'
import { TcaProviderType } from './tca-provider-type'

export interface TCACertification {
    certificationCategoryId: string
    certType: TcaCertificateType
    coursesCount: number
    dashedName: string
    description: string
    estimatedCompletionTime: number
    id: number
    introText: string
    learnerLevel: TCACertificationLearnLevel
    learningOutcomes: Array<string>
    prerequisites: Array<string>
    providers: Array<TcaProviderType>
    sequentialCourses: boolean
    skills: string[]
    status: TCACertificationStatus
    stripeProductId?: string
    title: string
}
