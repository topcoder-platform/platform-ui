import { LearnMyCertificationProgress } from './my-certifications-functions'

export interface MyCertificationsProviderData {
    completed: Array<LearnMyCertificationProgress & {completedDate: string}>
    inProgress: Array<LearnMyCertificationProgress & {
        currentLesson: string,
        startDate: string,
    }>
    loading: boolean
    ready: boolean
}
