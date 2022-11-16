import { LearnLesson } from './learn-lesson.model'
import { LearnModuleMeta } from './learn-module-meta.model'

export interface LearnModule {
    key: string
    lessons: Array<LearnLesson>
    meta: LearnModuleMeta
}
