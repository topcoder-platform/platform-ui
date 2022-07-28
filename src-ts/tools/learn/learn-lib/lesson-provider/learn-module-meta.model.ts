export interface LearnModuleMeta {
    dashedName: string
    estimatedCompletionTime: {
        units: string
        value: number
    }
    introCopy: Array<string>
    lessonCount: number
    name: string
}
