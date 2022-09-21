import { LearnUserCertificationProgress } from './user-certifications-functions'

export interface UserCertificationProgressProviderData {
    certificationProgress?: LearnUserCertificationProgress
    loading: boolean
    ready: boolean
    refetch: () => void,
    setCertificateProgress: (progess: LearnUserCertificationProgress) => void,
}
