/* eslint-disable sort-keys */
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
    company: '',
    position: '',
    industry: '',
    city: '',
    startDate: undefined,
    dateDescription: '',
    endDate: undefined,
    currentlyWorking: false,
    id: 0,
})
