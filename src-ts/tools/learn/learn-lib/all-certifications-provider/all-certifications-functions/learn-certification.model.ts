import { LearnCertificateTrackType } from './learn-certificate-track-type'

export interface LearnCertification {
    category: string
    certification: string
    certType: 'certification'|'course-completion'
    completionHours: number
    id: string
    key: string
    providerCrertificationId: string
    providerName: string
    state: 'active' | 'coming-soon'
    title: string
    trackType: LearnCertificateTrackType
}
