import { LearnModelBase } from '../../functions'

import { LearnCertificateTrackType } from './learn-certificate-track-type'

export interface LearnCertification extends LearnModelBase {
    category: string
    certification: string
    certType: 'certification' | 'course-completion'
    completionHours: number
    id: string
    key: string
    providerCrertificationId: string
    providerName: string
    publishedAt?: Date
    state: 'active' | 'coming-soon'
    title: string
    trackType: LearnCertificateTrackType
}
