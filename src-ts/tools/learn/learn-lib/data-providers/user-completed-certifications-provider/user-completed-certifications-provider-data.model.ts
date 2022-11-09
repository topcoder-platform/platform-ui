import { LearnUserCompletedCertification } from './user-completed-certifications-functions'

export interface UserCompletedCertificationsProviderData {
    certifications: ReadonlyArray<LearnUserCompletedCertification>
    loading: boolean
    ready: boolean
}
