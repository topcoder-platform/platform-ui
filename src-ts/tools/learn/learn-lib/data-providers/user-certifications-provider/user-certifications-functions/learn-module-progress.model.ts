export interface LearnModuleProgress {
    completedLessons: Array<{
        completedDate?: string
        dashedName: string
        id: string
    }>
    completedPercentage: number
    module: string
    moduleStatus: string
}
