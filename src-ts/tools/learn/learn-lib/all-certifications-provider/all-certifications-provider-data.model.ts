import { LearnCertification } from './all-certifications-functions'

export interface AllCertificationsProviderData {
    certification?: LearnCertification
    certifications: Array<LearnCertification>
    loading: boolean
    ready: boolean
}
