import { MemberMaxRating } from '~/apps/talent-search/src/lib/models'
import { MemberStats } from '~/libs/core'
import { Skill } from '~/libs/shared'

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
    emsiSkills: Array<Skill>
    stats: Array<MemberStats>
    addresses?: MemberAddress[]
    country: string
    photoURL: string
    createdAt: number
    description: string
}
