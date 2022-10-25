import { LearnCertification } from "./learn-certification.model"

export interface AllCertificationsProviderData {
    certification?: LearnCertification
    certifications: Array<LearnCertification>
    loading: boolean
    ready: boolean
    error: boolean
}
