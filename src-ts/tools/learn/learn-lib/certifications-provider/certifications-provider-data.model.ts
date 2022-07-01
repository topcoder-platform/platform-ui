import { LearnCertification } from './certifications-functions'

export interface CertificationsProviderData {
    certification?: LearnCertification
    certifications: Array<LearnCertification>
    certificationsCount: number
    loading: boolean
    ready: boolean
}
