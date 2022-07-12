import { LearnMyModuleProgress } from './learn-my-module-progress.model'
import { MyCertificationProgressStatus } from './my-certification-progress-status.enum'

export interface LearnMyCertificationProgress {
    certification: string
    certificationId: string
    completedDate?: string
    completedPercentage: number
    courseId: string
    courseKey: string
    currentLesson?: string
    id: string
    modules: Array<LearnMyModuleProgress>
    provider: string
    startDate: string
    status: MyCertificationProgressStatus
}
