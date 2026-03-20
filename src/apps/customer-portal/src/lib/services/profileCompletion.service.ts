import { EnvironmentConfig } from '~/config'
import { UserSkill, xhrGetAsync } from '~/libs/core'

export type CompletedProfile = {
    countryCode?: string
    countryName?: string
    city?: string
    firstName?: string
    handle: string
    lastName?: string
    photoURL?: string
    skillCount?: number
    userId?: number | string
    isOpenToWork?: boolean | null
    openToWork?: {
        availability?: string
        preferredRoles?: string[]
    } | null
}

export type CompletedProfilesResponse = {
    data: CompletedProfile[]
    page: number
    perPage: number
    total: number
    totalPages: number
}

export const DEFAULT_PAGE_SIZE = 50

function normalizeToList(raw: any): any[] {
    if (Array.isArray(raw)) {
        return raw
    }

    if (Array.isArray(raw?.data)) {
        return raw.data
    }

    if (Array.isArray(raw?.result?.content)) {
        return raw.result.content
    }

    if (Array.isArray(raw?.result)) {
        return raw.result
    }

    return []
}

function normalizeCompletedProfilesResponse(
    raw: any,
    fallbackPage: number,
    fallbackPerPage: number,
): CompletedProfilesResponse {
    if (raw && Array.isArray(raw.data)) {
        const total: number = Number(raw.total ?? raw.data.length)
        const perPage: number = Number(raw.perPage ?? fallbackPerPage)
        const page: number = Number(raw.page ?? fallbackPage)
        const safePerPage = Number.isFinite(perPage) ? Math.max(perPage, 1) : fallbackPerPage
        const safeTotal = Number.isFinite(total) ? Math.max(total, 0) : raw.data.length

        return {
            data: raw.data,
            page: Number.isFinite(page) ? Math.max(page, 1) : fallbackPage,
            perPage: safePerPage,
            total: safeTotal,
            totalPages: Number.isFinite(raw.totalPages)
                ? Math.max(Number(raw.totalPages), 1)
                : Math.max(Math.ceil(safeTotal / safePerPage), 1),
        }
    }

    const rows = normalizeToList(raw)
    const total = Number(raw?.total ?? rows.length)
    const safeTotal = Number.isFinite(total) ? Math.max(total, 0) : rows.length

    return {
        data: rows,
        page: fallbackPage,
        perPage: fallbackPerPage,
        total: safeTotal,
        totalPages: Math.max(Math.ceil(safeTotal / fallbackPerPage), 1),
    }
}

export type OpenToWorkFilter = 'all' | 'yes' | 'no'

export async function fetchCompletedProfiles(
    countryCode: string | undefined,
    page: number,
    perPage: number,
    openToWorkFilter?: OpenToWorkFilter,
    skillIds?: string[],
): Promise<CompletedProfilesResponse> {
    const queryParams = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
    })

    if (countryCode) {
        queryParams.set('countryCode', countryCode)
    }

    if (openToWorkFilter === 'yes') {
        queryParams.set('openToWork', 'true')
    }

    if (openToWorkFilter === 'no') {
        queryParams.set('openToWork', 'false')
    }

    if (Array.isArray(skillIds) && skillIds.length > 0) {
        skillIds.forEach(id => {
            if (id) {
                queryParams.append('skillId', String(id))
            }
        })
    }

    const response = await xhrGetAsync<any>(
        `${EnvironmentConfig.REPORTS_API}/topcoder/completed-profiles?${queryParams.toString()}`,
    )

    return normalizeCompletedProfilesResponse(response, page, perPage)
}

export async function fetchMemberSkillsData(userId: string | number | undefined): Promise<UserSkill[]> {
    if (!userId) {
        return []
    }

    const baseUrl = `${EnvironmentConfig.API.V5}/standardized-skills`
    const url = `${baseUrl}/user-skills/${userId}?disablePagination=true`

    try {
        return await xhrGetAsync<UserSkill[]>(url)
    } catch {
        // If skills API fails, return empty array to not block the page
        return []
    }
}
