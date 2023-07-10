export default interface EducationInfo {
    collegeName: string
    major: string
    dateDescription: string
    startDate?: Date
    endDate?: Date
    id: number
}

export const emptyEducationInfo: () => EducationInfo = () => ({
    collegeName: '',
    dateDescription: '',
    endDate: undefined,
    id: 0,
    major: '',
    startDate: undefined,
})
