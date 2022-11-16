import { LearnCourse } from './learn-course.model'

export interface CoursesProviderData {
    course?: LearnCourse
    loading: boolean
    ready: boolean
}
