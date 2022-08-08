import { LearnUserCertificationProgress } from './user-certifications-functions'

export interface UserCertificationProgressProviderData {
    certificationProgress?: LearnUserCertificationProgress
    loading: boolean
    ready: boolean
    setCertificateProgress: (progess: LearnUserCertificationProgress) => void,
}
