export interface OpenToWorkTrait {
    availability?: string
    preferredRoles?: string[]
}

export type PersonalizationTrait =
    | { profileSelfTitle: string }
    | { shortBio: string }
    | { referAs: string }
    | { openToWork: OpenToWorkTrait }
    | { links: Array<{ url: string; name: string }> }

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export default interface PersonalizationInfo extends Array<PersonalizationTrait> {}

export const emptyPersonalizationInfo = (): PersonalizationInfo => []
