import { LearnMyCertificationProgress } from './my-certifications-functions'

export interface MyCertificationCompleted extends LearnMyCertificationProgress {
    completedDate: string
}
