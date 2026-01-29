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
}

export const emptyWorkInfo: () => WorkInfo = () => ({
    company: '',
    currentlyWorking: false,
    dateDescription: '',
    endDate: undefined,
    id: 0,
    industry: '',
    otherIndustry: '',
    position: '',
    startDate: undefined,
})
