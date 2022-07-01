import { LearnMyCertification } from './learn-my-certification.model'

export interface MyCertificationsProviderData {
    certifications: Array<LearnMyCertification>
    completed: Array<LearnMyCertification>
    inProgress: Array<LearnMyCertification>
    loading: boolean
    ready: boolean
}
