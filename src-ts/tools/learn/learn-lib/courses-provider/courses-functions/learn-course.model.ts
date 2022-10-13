import { LearnModelBase } from '../../functions'
import { LearnModule } from '../../lesson-provider'

export interface LearnCourse extends LearnModelBase {
    certification: string
    certificationId: string
    completionSuggestions: Array<string>
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
