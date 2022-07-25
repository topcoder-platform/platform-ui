import { LearnUserCertificationProgress } from './user-certifications-functions'

export interface UserCertificationInProgress extends LearnUserCertificationProgress {
    currentLesson: string
    startDate: string
}
