import { LearnCertification } from './all-certifications-functions'

export interface AllCertificationsProviderData {
    certification?: LearnCertification
    allCertifications: Array<LearnCertification>
    certifications: Array<LearnCertification>
    loading: boolean
    ready: boolean
}
