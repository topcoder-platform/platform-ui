import { LearnModelBase } from '../../functions'

import { LearnCertificateTrackType } from './learn-certificate-track-type'

export interface LearnCertification extends LearnModelBase {
    category: string
    certification: string
    certType: 'certification' | 'course-completion'
    completionHours: number
    fccId: string
    id: string
    key: string
    moduleCount: string
    providerCrertificationId: string
    providerName: string
    publishedAt?: Date
    state: 'active' | 'coming-soon'
    title: string
    trackType: LearnCertificateTrackType
}
