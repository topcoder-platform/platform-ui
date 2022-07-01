import { LearnMyCertificationProgress } from './my-certifications-functions'

export interface MyCertificationProgressProviderData {
    certificateProgress?: LearnMyCertificationProgress
    loading: boolean
    ready: boolean
    setCertificateProgress: (progess: LearnMyCertificationProgress) => void,
}
