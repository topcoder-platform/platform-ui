import { LearnModelBase } from '../../functions'
import { LearnCourse } from '../courses-provider'
import { ResourceProvider } from '../resource-provider-provider'

import { LearnCertificateTrackType } from './learn-certificate-track-type'
import { CertificationLearnLevel } from './learn-certification-level-type'

export interface LearnCertification extends LearnModelBase {
    category: string
    certification: string
    certType: 'certification' | 'course-completion'
    completionHours: number
    course: LearnCourse
    description: string
    fccId: string
    id: string
    key: string
    learnerLevel: CertificationLearnLevel
    moduleCount: string | number
    providerCrertificationId: string
    publishedAt?: Date
    resourceProvider: ResourceProvider
    state: 'active' | 'coming-soon'
    title: string
    trackType: LearnCertificateTrackType
}
