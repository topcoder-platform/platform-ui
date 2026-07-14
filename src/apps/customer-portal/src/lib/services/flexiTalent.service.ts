import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

const BASE_URL = `${EnvironmentConfig.API.V6}/engagements/engagements`

export type FlexiEngagementBucket = 'total' | 'active' | 'closed'
export type FlexiEngagementSortBy = 'name' | 'memberCount'

/**
 * Member list buckets supported by the Flexi-Talent member endpoints.
 */
export type FlexiMemberBucket = 'total' | 'assigned' | 'completed'

/**
 * Server-side member sort fields supported by the Flexi-Talent member list endpoint.
 */
export type FlexiMemberSortBy = 'handle' | 'time'
export type FlexiSortOrder = 'asc' | 'desc'

export interface FlexiEngagementListRequest {
    bucket: FlexiEngagementBucket
    page: number
    perPage: number
    searchText?: string
    sortBy: FlexiEngagementSortBy
    sortOrder: FlexiSortOrder
}

export interface FlexiEngagementSummaryResponse {
    total: number
    active: number
    closed: number
}

export interface FlexiEngagementListItem {
    engagementId: string
    projectId: string
    projectName?: string
    engagementTitle: string
    status: string
    assignedMemberCount: number
    requiredMemberCount?: number | null
}

export interface FlexiEngagementListResponse {
    data: FlexiEngagementListItem[]
    page: number
    perPage: number
    total: number
    totalPages: number
}

export interface FlexiSkillReference {
    id: string
    name: string
}

export interface FlexiEngagementAssignmentRow {
    assignmentId: string
    engagementId: string
    projectId: string
    memberId: string
    memberHandle: string
    status: string
    displayStatusLabel: string
    startDate?: string | null
    endDate?: string | null
    resolvedEndDate?: string | null
    timeLeftDays?: number | null
    isOverdue: boolean
    durationMonths?: number | null
    durationWeeks?: number | null
    durationStartDate?: string | null
    durationEndDate?: string | null
    durationLabel?: string | null
}

export interface FlexiEngagementDetailResponse {
    engagementId: string
    projectId: string
    projectName?: string
    engagementTitle: string
    description: string
    status: string
    requiredMemberCount?: number | null
    assignedMemberCount: number
    skills: FlexiSkillReference[]
    durationMonths?: number | null
    durationWeeks?: number | null
    durationStartDate?: string | null
    durationEndDate?: string | null
    durationLabel?: string | null
    assignments: FlexiEngagementAssignmentRow[]
}

export interface FlexiEngagementWorkLinks {
    projectUrl?: string
    engagementUrl?: string
    assigneeDetailsUrl?: string
}

export type FlexiEngagementDetail = FlexiEngagementDetailResponse & {
    workLinks: FlexiEngagementWorkLinks
}

/**
 * Query parameters used to fetch one page of Flexi-Talent members.
 */
export interface FlexiMemberListRequest {
    bucket: FlexiMemberBucket
    page: number
    perPage: number
    searchText?: string
    sortBy: FlexiMemberSortBy
    sortOrder: FlexiSortOrder
}

/**
 * Summary counts returned by the Flexi-Talent member summary endpoint.
 */
export interface FlexiMemberSummaryResponse {
    totalUniqueMembers: number
    assignedMembers: number
    completedMembers: number
}

/**
 * Member row returned by the paginated Flexi-Talent member list endpoint.
 */
export interface FlexiMemberListItem {
    memberId: string
    handle: string
    assignmentId?: string | null
    primaryProjectId?: string | null
    primaryProjectName?: string | null
    primaryEngagementId?: string | null
    primaryEngagementTitle?: string | null
    isCurrentlyAssigned: boolean
    daysRemaining?: number | null
    latestCompletedAt?: string | null
    status: string
    displayStatusLabel: string
}

/**
 * Paginated response returned by the Flexi-Talent member list endpoint.
 */
export interface FlexiMemberListResponse {
    data: FlexiMemberListItem[]
    page: number
    perPage: number
    total: number
    totalPages: number
}

/**
 * Detail response returned for one selected Flexi-Talent member.
 *
 * Mirrors `FlexiMemberDetailDto` from engagements-api-v6 with API `Date`
 * values represented as serialized ISO strings in the browser.
 */
export interface FlexiMemberDetailResponse {
    memberId: string
    handle: string
    isCurrentlyAssigned: boolean
    assignmentId: string
    projectId: string
    projectName?: string
    engagementId: string
    engagementTitle: string
    description: string
    status: string
    displayStatusLabel: string
    skills: FlexiSkillReference[]
    startDate?: string | null
    endDate?: string | null
    resolvedEndDate?: string | null
    timeLeftDays?: number | null
    isOverdue: boolean
    durationMonths?: number | null
    durationWeeks?: number | null
    durationStartDate?: string | null
    durationEndDate?: string | null
    durationLabel?: string | null
}

/**
 * History row returned for one member assignment in backend-defined order.
 *
 * Mirrors `FlexiMemberHistoryItemDto` from engagements-api-v6. History rows use
 * `memberHandle`; they do not expose the detail DTO's `handle` property.
 */
export interface FlexiMemberHistoryItemResponse {
    assignmentId: string
    memberId: string
    memberHandle: string
    projectId: string
    projectName?: string
    engagementId: string
    engagementTitle: string
    status: string
    displayStatusLabel: string
    isCurrent: boolean
    skills: FlexiSkillReference[]
    startDate?: string | null
    endDate?: string | null
    resolvedEndDate?: string | null
    timeLeftDays?: number | null
    isOverdue: boolean
    completedAt?: string | null
    durationMonths?: number | null
    durationWeeks?: number | null
    durationStartDate?: string | null
    durationEndDate?: string | null
    durationLabel?: string | null
}

/**
 * Unpaginated history response returned for one selected Flexi-Talent member.
 *
 * Mirrors `FlexiMemberHistoryDto` from engagements-api-v6 and preserves the
 * top-level member identity fields alongside the row collection.
 */
export interface FlexiMemberHistoryResponse {
    memberId: string
    handle: string
    data: FlexiMemberHistoryItemResponse[]
}

/**
 * Normalized Work Manager links exposed on member detail and history rows.
 */
export type FlexiMemberWorkLinks = FlexiEngagementWorkLinks

/**
 * Member detail response with normalized Work Manager links.
 */
export type FlexiMemberDetail = FlexiMemberDetailResponse & {
    workLinks: FlexiMemberWorkLinks
}

/**
 * Member history row with normalized Work Manager links.
 */
export type FlexiMemberHistoryItem = FlexiMemberHistoryItemResponse & {
    workLinks: FlexiMemberWorkLinks
}

/**
 * Member history response with top-level member identity and Work Manager links
 * attached to each assignment row.
 */
export interface FlexiMemberHistory {
    memberId: string
    handle: string
    data: FlexiMemberHistoryItem[]
}

/**
 * Builds Work Manager links for the project, engagement detail, and engagement-scoped assignment page.
 *
 * @param projectId Work project id returned by engagements-api-v6.
 * @param engagementId Engagement id returned by engagements-api-v6.
 * @returns Link URLs with entries omitted when the ids required for that destination are missing.
 */
function buildFlexiEngagementWorkLinks(
    projectId?: string | null,
    engagementId?: string | null,
): FlexiEngagementWorkLinks {
    const baseUrl = EnvironmentConfig.ADMIN.WORK_MANAGER_URL.replace(/\/$/, '')
    const normalizedProjectId = String(projectId || '')
        .trim()
    const normalizedEngagementId = String(engagementId || '')
        .trim()

    if (!normalizedProjectId) {
        return {}
    }

    const links: FlexiEngagementWorkLinks = {
        projectUrl: `${baseUrl}/projects/${normalizedProjectId}`,
    }

    if (normalizedEngagementId) {
        links.engagementUrl = `${baseUrl}/projects/${normalizedProjectId}/engagements/${normalizedEngagementId}`
        links.assigneeDetailsUrl
            = `${baseUrl}/projects/${normalizedProjectId}/engagements/${normalizedEngagementId}/assignments`
    }

    return links
}

/**
 * Builds Work Manager links for member assignment rows.
 *
 * @param projectId Work project id returned by engagements-api-v6.
 * @param engagementId Engagement id returned by engagements-api-v6.
 * @returns Link URLs with entries omitted when the ids required for that destination are missing.
 */
function buildFlexiMemberWorkLinks(
    projectId?: string | null,
    engagementId?: string | null,
): FlexiMemberWorkLinks {
    return buildFlexiEngagementWorkLinks(projectId, engagementId)
}

/**
 * Fetches Flexi-Talent engagement summary counts.
 *
 * @returns Bucket counts for total, active, and closed engagements.
 * @throws Any request error raised by the shared xhr client.
 */
export async function getFlexiEngagementSummary(): Promise<FlexiEngagementSummaryResponse> {
    return xhrGetAsync<FlexiEngagementSummaryResponse>(`${BASE_URL}/flexi-talent/engagements/summary`)
}

/**
 * Fetches one body-paginated page of Flexi-Talent engagements.
 *
 * @param params Bucket, search, sort, and pagination query parameters.
 * @returns Engagement list rows and top-level pagination fields.
 * @throws Any request error raised by the shared xhr client.
 */
export async function getFlexiEngagementList(
    params: FlexiEngagementListRequest,
): Promise<FlexiEngagementListResponse> {
    const queryParams = new URLSearchParams({
        bucket: params.bucket,
        page: String(params.page),
        perPage: String(params.perPage),
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
    })

    if (params.searchText !== undefined) {
        queryParams.set('searchText', params.searchText)
    }

    return xhrGetAsync<FlexiEngagementListResponse>(
        `${BASE_URL}/flexi-talent/engagements?${queryParams.toString()}`,
    )
}

/**
 * Fetches one Flexi-Talent engagement detail and adds safe Work Manager links.
 *
 * @param engagementId Engagement id for the selected list row.
 * @returns Engagement detail, assignment rows, skills, and normalized Work Manager links.
 * @throws Any request error raised by the shared xhr client.
 */
export async function getFlexiEngagementDetail(engagementId: string): Promise<FlexiEngagementDetail> {
    const response = await xhrGetAsync<FlexiEngagementDetailResponse>(
        `${BASE_URL}/flexi-talent/engagements/${engagementId}`,
    )

    return {
        ...response,
        workLinks: buildFlexiEngagementWorkLinks(response.projectId, response.engagementId),
    }
}

/**
 * Fetches Flexi-Talent member summary counts.
 *
 * @returns Bucket counts for total unique, assigned, and completed members.
 * @throws Any request error raised by the shared xhr client.
 */
export async function getFlexiMemberSummary(): Promise<FlexiMemberSummaryResponse> {
    return xhrGetAsync<FlexiMemberSummaryResponse>(`${BASE_URL}/flexi-talent/members/summary`)
}

/**
 * Fetches one body-paginated page of Flexi-Talent members.
 *
 * @param params Bucket, handle search, sort, and pagination query parameters.
 * @returns Member list rows and top-level pagination fields.
 * @throws Any request error raised by the shared xhr client.
 */
export async function getFlexiMemberList(
    params: FlexiMemberListRequest,
): Promise<FlexiMemberListResponse> {
    const queryParams = new URLSearchParams({
        bucket: params.bucket,
        page: String(params.page),
        perPage: String(params.perPage),
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
    })

    if (params.searchText !== undefined) {
        queryParams.set('searchText', params.searchText)
    }

    return xhrGetAsync<FlexiMemberListResponse>(
        `${BASE_URL}/flexi-talent/members?${queryParams.toString()}`,
    )
}

/**
 * Fetches one Flexi-Talent member detail and adds safe Work Manager links.
 *
 * @param memberId Member id for the selected list row.
 * @returns Member detail, assignment metadata, skills, timing fields, and normalized Work Manager links.
 * @throws Any request error raised by the shared xhr client.
 */
export async function getFlexiMemberDetail(memberId: string): Promise<FlexiMemberDetail> {
    const response = await xhrGetAsync<FlexiMemberDetailResponse>(
        `${BASE_URL}/flexi-talent/members/${memberId}`,
    )

    return {
        ...response,
        workLinks: buildFlexiMemberWorkLinks(response.projectId, response.engagementId),
    }
}

/**
 * Fetches full ordered assignment history for a Flexi-Talent member.
 *
 * @param memberId Member id for the selected list row.
 * @returns Top-level member identity and backend-ordered assignment rows with normalized Work Manager links.
 * @throws Any request error raised by the shared xhr client.
 */
export async function getFlexiMemberHistory(memberId: string): Promise<FlexiMemberHistory> {
    const response = await xhrGetAsync<FlexiMemberHistoryResponse>(
        `${BASE_URL}/flexi-talent/members/${memberId}/history`,
    )

    return {
        data: (Array.isArray(response.data) ? response.data : []).map(row => ({
            ...row,
            workLinks: buildFlexiMemberWorkLinks(row.projectId, row.engagementId),
        })),
        handle: response.handle,
        memberId: response.memberId,
    }
}
