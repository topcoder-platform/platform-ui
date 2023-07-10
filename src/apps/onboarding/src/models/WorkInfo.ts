export default interface WorkInfo {
    company?: string
    position?: string
    industry?: string
    city?: string
    startDate?: Date
    dateDescription?: string
    endDate?: Date
    currentlyWorking?: boolean
    id: number
}

export const emptyWorkInfo: () => WorkInfo = () => ({
    city: '',
    company: '',
    currentlyWorking: false,
    dateDescription: '',
    endDate: undefined,
    id: 0,
    industry: '',
    position: '',
    startDate: undefined,
})
