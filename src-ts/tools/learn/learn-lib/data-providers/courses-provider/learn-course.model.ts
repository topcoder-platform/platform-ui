import { LearnModelBase } from '../../functions'
import { LearnModule } from '../lesson-provider'
import { ResourceProvider } from '../resource-provider-provider'

export interface LearnCourse extends LearnModelBase {
    certification: string
    certificationId: string
    completionSuggestions: Array<string>
    estimatedCompletionTimeValue: number
    estimatedCompletionTimeUnits: string
    id: string
    introCopy: Array<string>
    key: string
    keyPoints: Array<string>
    moduleCount: number
    modules: Array<LearnModule>
    note: string
    resourceProvider: ResourceProvider
    skills: Array<string>
    title: string
}
