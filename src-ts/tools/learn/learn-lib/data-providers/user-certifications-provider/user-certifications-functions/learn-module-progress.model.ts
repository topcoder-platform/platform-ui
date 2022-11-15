export interface LearnModuleProgress {
    completedLessons: Array<{
        completedDate?: string
        dashedName: string
    }>
    completedPercentage: number
    module: string
    moduleStatus: string
}
