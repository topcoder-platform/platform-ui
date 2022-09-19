import { LearnCertification } from './all-certifications-functions'

export interface AllCertificationsProviderData {
    allCertifications: Array<LearnCertification>
    certification?: LearnCertification
    certifications: Array<LearnCertification>
    loading: boolean
    ready: boolean
}
