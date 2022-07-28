import { LearnModule } from '../../lesson-provider'

export interface LearnCourse {
    certification: string
    certificationId: string
    estimatedCompletionTime: {
        units: string
        value: number
    }
    id: string
    introCopy: Array<string>
    key: string
    keyPoints: Array<string>
    moduleCount: number
    modules: Array<LearnModule>
    note: string
    provider: string
    title: string
}