export interface LearnMyModuleProgress {
    completedLessons: Array<{
        completedDate?: string
        dashedName: string
    }>
    lessonCount: number
    module: string
}
