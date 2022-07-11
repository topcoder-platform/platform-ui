import { LearnLessonMeta } from './learn-lesson-meta.model'

export interface LessonProviderData {
    lesson?: LearnLessonMeta
    loading: boolean
    ready: boolean
}
