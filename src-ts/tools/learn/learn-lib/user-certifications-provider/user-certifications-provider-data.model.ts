import { LearnUserCertificationProgress } from './user-certifications-functions'

export interface UserCertificationsProviderData {
    completed: Array<LearnUserCertificationProgress & { completedDate: string }>
    inProgress: Array<LearnUserCertificationProgress & {
        currentLesson: string,
        startDate: string,
    }>
    loading: boolean
    ready: boolean
}
