import { LearnMyModuleProgress } from './learn-my-module-progress.model'
import { MyCertificationProgressStatus } from './my-certification-progress-status.enum'

export interface LearnMyCertificationProgress {
    academicHonestyPolicyAcceptedAt?: number,
    certification: string
    certificationId: string
    completedDate?: string
    courseProgressPercentage: number
    courseId: string
    courseKey: string
    currentLesson?: string
    id: string
    modules: Array<LearnMyModuleProgress>
    provider: string
    startDate: string
    status: MyCertificationProgressStatus
}
