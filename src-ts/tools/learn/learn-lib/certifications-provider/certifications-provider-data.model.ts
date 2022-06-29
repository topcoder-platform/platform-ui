import { LearnCertification } from './certifications-functions'

export interface CertificationsProviderData {
    certifications: Array<LearnCertification>
    certificationsCount: number
    loading: boolean
    ready: boolean
}
