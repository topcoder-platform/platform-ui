export interface LearnMyModuleProgress {
    completedLessons: Array<{
        completedDate?: string
        dashedName: string
    }>
    completedPercentage: number
    lessonCount: number
    module: string
    moduleStatus: string
}
