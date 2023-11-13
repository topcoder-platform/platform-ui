import { KeyedMutator } from 'swr'

import { LearnCourse } from './learn-course.model'

export interface CoursesProviderData {
    course?: LearnCourse
    loading: boolean
    mutate: KeyedMutator<any>
    ready: boolean
}
