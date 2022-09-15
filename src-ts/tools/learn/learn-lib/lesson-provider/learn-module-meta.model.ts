export interface LearnModuleMeta {
    dashedName: string
    estimatedCompletionTime: {
        units: string
        value: number
    }
    introCopy: Array<string>
    isAssessment: boolean
    name: string
}
