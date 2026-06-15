import { MemberStats, UserSkill } from '~/libs/core'

import MemberAddress from './MemberAddress'

export type MemberMaxRating = {
    rating?: number
}

export default interface MemberInfo {
    userId: number
    handle: string
    status: string
    firstName: string
    lastName: string
    competitionCountryCode: string
    email: string
    accountAge: number
    maxRating: MemberMaxRating
    skills: Array<UserSkill>
    stats: Array<MemberStats>
    availableForGigs: boolean
    addresses?: MemberAddress[]
    country: string
    photoURL: string
    createdAt: number
    description: string
}
