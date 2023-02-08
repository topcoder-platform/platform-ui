import { LearnModelBase } from '../../functions'

import { LearnLesson } from './learn-lesson.model'

export interface LearnModule extends LearnModelBase {
    dashedName: string
    estimatedCompletionTimeValue: number
    estimatedCompletionTimeUnits: string
    introCopy: Array<string>
    isAssessment: boolean
    key: string
    lessons: Array<LearnLesson>
    name: string
    order: number
}
