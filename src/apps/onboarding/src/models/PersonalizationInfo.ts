/* eslint-disable sort-keys */
export default interface PersonalizationInfo {
    referAs: string
    profileSelfTitle: string
    shortBio: string
}

export const emptyPersonalizationInfo: () => PersonalizationInfo = () => ({
    referAs: '',
    profileSelfTitle: '',
    shortBio: '',
})
