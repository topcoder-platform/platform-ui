import { UserSkill } from './user-skill.model'

export type TC_TRACKS = 'DEVELOP' | 'DESIGN' | 'DATA_SCIENCE'

export enum NamesAndHandleAppearance {
    both = 'namesAndHandle',
    handleOnly = 'handleOnly',
    nameOnly = 'namesOnly',
}

export interface UserProfile {
    addresses?: Array<{
        city?: string
        stateCode?: string
        streetAddr1?: string
        streetAddr2?: string
        zip?: string
    }>
    availableForGigs: boolean
    competitionCountryCode: string
    createdAt: number
    description: string
    email: string
    firstName: string
    handle: string
    handleLower: string
    homeCountryCode: string
    isCustomer?: boolean
    isMember?: boolean
    isWipro: boolean
    lastName: string
    maxRating: {
        rating: number
    }
    photoURL?: string
    roles: Array<string>
    skills: Array<UserSkill>
    status: string
    tracks?: Array<TC_TRACKS>
    updatedAt: number
    userId: number
    namesAndHandleAppearance: NamesAndHandleAppearance
}
