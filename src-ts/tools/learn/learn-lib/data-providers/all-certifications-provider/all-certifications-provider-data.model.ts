import { LearnCertification } from './learn-certification.model'

export interface AllCertificationsProviderData {
    certification?: LearnCertification
    certifications: Array<LearnCertification>
    error: boolean
    loading: boolean
    ready: boolean
}
