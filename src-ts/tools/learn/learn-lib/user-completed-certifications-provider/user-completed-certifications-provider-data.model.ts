import { LearnUserCompletedCertification } from "./user-completed-certifications-functions"

export interface UserCompletedCertificationsProviderData {
    certifications: Array<LearnUserCompletedCertification>
    loading: boolean
    ready: boolean
}
