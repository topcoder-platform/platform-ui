import { LearnMyCertificationProgress } from './my-certifications-functions'

export interface MyCertificationInProgress extends LearnMyCertificationProgress {
    currentLesson: string
    startDate: string
}
