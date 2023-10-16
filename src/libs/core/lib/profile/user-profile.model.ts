import { UserEMSISkill, UserSkill } from './user-skill.model'

export type TC_TRACKS = 'DEVELOP' | 'DESIGN' | 'DATA_SCIENCE'

export interface UserProfile {
    addresses?: Array<{
        city?: string
        stateCode?: string
        streetAddr1?: string
        streetAddr2?: string
        zip?: string
    }>
    competitionCountryCode: string
    createdAt: number
    description: string
    diceEnabled: boolean
    email: string
    // TODO: clean up the type when transition to TC skills is done
    emsiSkills: Array<UserEMSISkill>
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
}
