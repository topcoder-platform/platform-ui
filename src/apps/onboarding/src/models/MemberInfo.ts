import { MemberEmsiSkill, MemberMaxRating } from '~/apps/talent-search/src/lib/models'
import { MemberStats } from '~/libs/core'

import MemberAddress from './MemberAddress'

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
    emsiSkills: Array<MemberEmsiSkill>
    stats: Array<MemberStats>
    addresses?: MemberAddress[]
    country: string
    photoURL: string
    createdAt: number
}
