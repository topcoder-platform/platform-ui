import { LearnCertification } from './all-certifications-functions'

export interface AllCertificationsProviderData {
    certification?: LearnCertification
    certifications: Array<LearnCertification>
    certificationsCount: number
    loading: boolean
    ready: boolean
}
