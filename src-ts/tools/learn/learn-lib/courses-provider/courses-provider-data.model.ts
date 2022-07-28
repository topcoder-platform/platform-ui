import { LearnCourse } from './courses-functions'

export interface CoursesProviderData {
    course?: LearnCourse
    loading: boolean
    ready: boolean
}
