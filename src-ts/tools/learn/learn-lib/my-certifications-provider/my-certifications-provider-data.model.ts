import { LearnMyCertificationProgress } from './my-certifications-functions'

export interface MyCertificationsProviderData {
    completed: Array<LearnMyCertificationProgress>
    inProgress: Array<LearnMyCertificationProgress>
    loading: boolean
    ready: boolean
}
