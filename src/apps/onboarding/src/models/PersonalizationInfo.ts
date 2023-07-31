export default interface PersonalizationInfo {
    referAs?: string
    profileSelfTitle?: string
    shortBio?: string
    availableForGigs?: boolean
}

export const emptyPersonalizationInfo: () => PersonalizationInfo = () => ({
    availableForGigs: true,
    profileSelfTitle: '',
    referAs: '',
    shortBio: '',
})
