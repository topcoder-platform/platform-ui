export default interface WorkInfo {
    company?: string
    position?: string
    industry?: string
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
    position: '',
    startDate: undefined,
})
