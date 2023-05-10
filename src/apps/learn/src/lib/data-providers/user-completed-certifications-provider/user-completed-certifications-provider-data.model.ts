import { LearnUserCertificationProgress } from '../user-certifications-provider'

export interface UserCompletedCertificationsProviderData {
    certifications: ReadonlyArray<LearnUserCertificationProgress>
    loading: boolean
    ready: boolean
}
