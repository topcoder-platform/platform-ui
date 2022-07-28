import { LearnModuleProgress } from './learn-module-progress.model'
import { UserCertificationProgressStatus } from './user-certification-progress-status.enum'

export interface LearnUserCertificationProgress {
    academicHonestyPolicyAcceptedAt?: number,
    certification: string
    certificationId: string
    completedDate?: string
    courseId: string
    courseKey: string
    courseProgressPercentage: number
    currentLesson?: string
    id: string
    modules: Array<LearnModuleProgress>
    provider: string
    startDate: string
    status: UserCertificationProgressStatus
}
