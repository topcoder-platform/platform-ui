export default interface PersonalizationInfo {
    referAs?: string
    profileSelfTitle?: string
    shortBio?: string
    openToWork?: {
        availability?: string,
        preferredRoles?: string[],
    }
}

export const emptyPersonalizationInfo: () => PersonalizationInfo = () => ({
    openToWork: {
        availability: '',
        preferredRoles: [],
    },
    profileSelfTitle: '',
    referAs: '',
    shortBio: '',
})
