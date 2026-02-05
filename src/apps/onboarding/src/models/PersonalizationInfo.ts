export interface OpenToWorkTrait {
    availability?: string
    preferredRoles?: string[]
}

export default interface PersonalizationInfo {
    referAs?: string
    profileSelfTitle?: string
    shortBio?: string
    links?: Array<{ url: string; name: string }>
    openToWork?: {
        availability?: string,
        preferredRoles?: string[],
    }
}

export const emptyPersonalizationInfo: () => PersonalizationInfo = () => ({
    links: [],
    openToWork: {
        availability: '',
        preferredRoles: [],
    },
    profileSelfTitle: '',
    referAs: '',
    shortBio: '',
})
