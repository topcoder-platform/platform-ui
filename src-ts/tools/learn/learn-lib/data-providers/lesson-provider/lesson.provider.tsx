import { CoursesProviderData, useGetCourses } from '../courses-provider'

import { LearnLesson } from './learn-lesson.model'
import { LearnModule } from './learn-module.model'
import { LessonProviderData } from './lesson-provider-data.model'

export function useGetLesson(
    provider: string,
    course?: string,
    module?: string,
    lesson?: string,
): LessonProviderData {

    const { course: courseData, loading, ready }: CoursesProviderData = useGetCourses(provider, course)

    const moduleData: LearnModule | undefined = courseData?.modules.find(m => m.key === module)
    const lessonData: LearnLesson | undefined = moduleData?.lessons.find(l => l.dashedName === lesson)

    const lessonUrl: string = [
        'learn',
        courseData?.key ?? course,
        module,
        lesson,
    ].filter(Boolean).join('/')

    return {
        lesson: !lessonData ? undefined : {
            ...lessonData,
            course: {
                certification: courseData?.certification ?? '',
                certificationId: courseData?.certificationId ?? '',
                id: courseData?.id ?? '',
                title: courseData?.title ?? '',
            },
            lessonUrl,
            module: {
                dashedName: moduleData?.meta.dashedName ?? '',
                title: moduleData?.meta.name ?? '',
            },
        },
        loading,
        ready,
    }
}
