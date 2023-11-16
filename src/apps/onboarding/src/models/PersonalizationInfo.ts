export default interface PersonalizationInfo {
    referAs?: string
    profileSelfTitle?: string
    shortBio?: string
}

export const emptyPersonalizationInfo: () => PersonalizationInfo = () => ({
    profileSelfTitle: '',
    referAs: '',
    shortBio: '',
})
