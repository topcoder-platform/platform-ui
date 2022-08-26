import { LearnUserCertificationProgress } from './user-certifications-functions'

export interface UserCertificationsProviderData {
    completed: ReadonlyArray<LearnUserCertificationProgress & { completedDate: string }>
    inProgress: ReadonlyArray<LearnUserCertificationProgress & {
        currentLesson: string,
        startDate: string,
    }>
    loading: boolean
    ready: boolean
}
