import { LearnMyModuleProgress } from './learn-my-module-progress.model'

export interface LearnMyCertificationProgress {
    completed: number
    completedDate?: string
    currentLesson?: string
    modules: Array<LearnMyModuleProgress>
    startedDate: string
    status: 'in-progress'|'completed'
}
