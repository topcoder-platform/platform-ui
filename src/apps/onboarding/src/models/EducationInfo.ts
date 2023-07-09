/* eslint-disable sort-keys */
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
    major: '',
    dateDescription: '',
    startDate: undefined,
    endDate: undefined,
    id: 0,
})
