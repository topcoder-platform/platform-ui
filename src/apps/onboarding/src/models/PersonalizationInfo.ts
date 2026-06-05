export interface OpenToWorkTrait {
    availability?: string
}

export default interface PersonalizationInfo {
    referAs?: string
    profileSelfTitle?: string
    preferredRoles?: string[]
    shortBio?: string
    links?: Array<{ url: string; name: string }>
    openToWork?: {
        availability?: string,
    }
}

export const emptyPersonalizationInfo: () => PersonalizationInfo = () => ({
    links: [],
    openToWork: {
        availability: '',
    },
    preferredRoles: [],
    profileSelfTitle: '',
    referAs: '',
    shortBio: '',
})
