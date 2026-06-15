import { EnvironmentConfig } from '~/config'
import { xhrPostAsync } from '~/libs/core'

export type SearchTalent = {
    id: string
    name: string
    handle: string
    photoUrl?: string
    location: string
    matchIndex: number
    isRecentlyActive: boolean
    openToWork: boolean
    isVerified: boolean
    matchedSkills: Array<{
        id: string
        isVerified: boolean
        name: string
        submitted: number
        wins: number
    }>
}

export type MemberSearchPayload = {
    countries?: string[]
    limit: number
    openToWork?: boolean
    page: number
    preferredRoles?: string[]
    profileComplete?: boolean
    recentlyActive?: boolean
    sortBy?: 'handle' | 'matchIndex'
    sortOrder?: 'asc' | 'desc'
    skillSearchType: 'OR'
    skills: Array<{
        id: string
        wins: number
    }>
    verifiedProfile?: boolean
}

export type MemberSearchResponse = {
    data?: SearchTalent[]
    limit?: number
    page?: number
    total?: number
}

export const MEMBER_SEARCH_LIMIT = 10

export async function searchMembers(payload: MemberSearchPayload): Promise<MemberSearchResponse> {
    return xhrPostAsync<MemberSearchPayload, MemberSearchResponse>(
        `${EnvironmentConfig.REPORTS_API}/member/search`,
        payload,
    )
}
