import { LearnUserCertificationProgress } from './user-certifications-functions'

export interface UserCertificationCompleted extends LearnUserCertificationProgress {
    completedDate: string
}
