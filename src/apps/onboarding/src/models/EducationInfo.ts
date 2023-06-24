/* eslint-disable sort-keys */
export default interface EducationInfo {
    collegeName: string
    major: string
    dateDescription: string
    startDate?: Date
    endDate?: Date
    graduated?: boolean
    id: number
}

export const emptyEducationInfo: () => EducationInfo = () => ({
    collegeName: '',
    major: '',
    dateDescription: '',
    startDate: undefined,
    endDate: undefined,
    graduated: false,
    id: 0,
})
