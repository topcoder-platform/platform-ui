export default interface WorkInfo {
    companyName?: string
    position?: string
    industry?: string
    otherIndustry?: string
    startDate?: Date
    dateDescription?: string
    description?: string
    endDate?: Date
    currentlyWorking?: boolean
    id: number
    city?: string
    associatedSkills?: string[]
}

export const emptyWorkInfo: () => WorkInfo = () => ({
    companyName: '',
    currentlyWorking: false,
    dateDescription: '',
    endDate: undefined,
    id: 0,
    industry: '',
    otherIndustry: '',
    position: '',
    startDate: undefined,
    city: undefined,
    associatedSkills: undefined,
})
