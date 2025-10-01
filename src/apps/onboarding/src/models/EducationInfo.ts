export default interface EducationInfo {
    collegeName: string
    major: string
    dateDescription: string
    endYear?: string
    id: number,
    traitId: string,
}

export const emptyEducationInfo: () => EducationInfo = () => ({
    collegeName: '',
    dateDescription: '',
    endYear: undefined,
    id: 0,
    major: '',
    traitId: '',
})
