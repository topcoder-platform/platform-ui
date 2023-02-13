export interface LearnLessonMeta {
    id: string
    course: {
        certification: string
        certificationId: string
        id: string
        title: string
    }
    dashedName: string
    lessonUrl: string
    module: {
        dashedName: string
        title: string
    }
    title: string
}
