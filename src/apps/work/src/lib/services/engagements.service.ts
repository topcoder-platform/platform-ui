/* eslint-disable complexity */

import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrGetPaginatedAsync,
    xhrPatchAsync,
    xhrPostAsync,
    xhrPutAsync,
} from '~/libs/core'

import {
    ENGAGEMENTS_API_URL,
    ENGAGEMENTS_ROOT_API_URL,
} from '../constants'
import {
    Assignment,
    Engagement,
    EngagementFilters,
    PaginationModel,
    Skill,
} from '../models'
import {
    fromEngagementAnticipatedStartApi,
    normalizeEngagement,
    toEngagementAnticipatedStartApi,
    toEngagementRoleApi,
    toEngagementStatusApi,
    toEngagementWorkloadApi,
} from '../utils'

interface BackendMeta {
    page?: number
    perPage?: number
    totalCount?: number
    totalPages?: number
}

interface BackendPaginatedResponse<T> {
    data?: T[]
    meta?: BackendMeta
}

interface AssignmentDetails {
    agreementRate?: string
    endDate?: string
    memberHandle?: string
    memberId?: number | string
    otherRemarks?: string
    startDate?: string
}

interface EngagementUpsertData extends Partial<Engagement> {
    assignmentDetails?: AssignmentDetails[]
}

interface EngagementResponse {
    data: Engagement[] | BackendPaginatedResponse<Engagement>
    page: number
    perPage: number
    total: number
    totalPages: number
}

export interface FetchEngagementsParams {
    page?: number
    perPage?: number
}

export interface FetchEngagementsResponse {
    data: Engagement[]
    metadata: PaginationModel
}

export interface EngagementFeedback {
    createdAt: string
    feedbackText: string
    givenByEmail?: string
    givenByHandle?: string
    id: number | string
    rating?: number
    updatedAt: string
}

export interface CreateEngagementFeedbackPayload {
    feedbackText: string
    rating?: number
}

export interface FeedbackLinkPayload {
    customerEmail: string
}

export interface MemberExperience {
    createdAt: string
    experienceText: string
    id: number | string
    memberHandle?: string
    memberId?: number | string
    updatedAt: string
}

export interface CreateMemberExperiencePayload {
    experienceText: string
}

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        message?: string
        response?: {
            data?: {
                message?: string
            }
        }
    }

    const message = typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage

    return new Error(message)
}

function normalizePaginatedResponse(
    response: EngagementResponse,
    fallbackPage?: number,
    fallbackPerPage?: number,
): {
    data: Engagement[]
    page: number
    perPage: number
    total: number
    totalPages: number
} {
    if (Array.isArray(response.data)) {
        return {
            data: response.data,
            page: response.page,
            perPage: response.perPage,
            total: response.total,
            totalPages: response.totalPages,
        }
    }

    const body = response.data
    const meta = body.meta

    return {
        data: body.data || [],
        page: meta?.page || response.page || fallbackPage || 1,
        perPage: meta?.perPage || response.perPage || fallbackPerPage || 0,
        total: meta?.totalCount || response.total || 0,
        totalPages: meta?.totalPages || response.totalPages || 0,
    }
}

function normalizeSkillIds(skills: Skill[] | undefined): string[] {
    if (!Array.isArray(skills)) {
        return []
    }

    return skills
        .map(skill => {
            if (typeof skill === 'string') {
                return skill
            }

            if (!skill || typeof skill !== 'object') {
                return ''
            }

            return String((skill as {
                id?: string
                value?: string
            }).id || (skill as {
                id?: string
                value?: string
            }).value || '')
                .trim()
        })
        .filter(Boolean)
}

function createQuery(
    filters: EngagementFilters,
    params: FetchEngagementsParams,
): string {
    const query = new URLSearchParams()

    if (filters.projectId !== undefined) {
        query.set('projectId', String(filters.projectId))
    }

    if (filters.status && filters.status !== 'all') {
        query.set('status', toEngagementStatusApi(filters.status))
    }

    if (filters.title) {
        query.set('title', filters.title.trim())
    }

    if (filters.sortBy) {
        query.set('sortBy', filters.sortBy)
    }

    if (filters.sortOrder) {
        query.set('sortOrder', filters.sortOrder)
    }

    if (filters.includePrivate) {
        query.set('includePrivate', 'true')
    }

    if (Array.isArray(filters.countries)) {
        filters.countries
            .map(country => country.trim())
            .filter(Boolean)
            .forEach(country => {
                query.append('countries', country)
            })
    }

    if (Array.isArray(filters.timezones)) {
        filters.timezones
            .map(timezone => timezone.trim())
            .filter(Boolean)
            .forEach(timezone => {
                query.append('timeZones', timezone)
            })
    }

    if (params.page) {
        query.set('page', String(params.page))
    }

    if (params.perPage) {
        query.set('perPage', String(params.perPage))
    }

    return query.toString()
}

function serializeEngagementPayload(data: EngagementUpsertData): Record<string, unknown> {
    const payload: Record<string, unknown> = {}

    if (data.anticipatedStart) {
        payload.anticipatedStart = toEngagementAnticipatedStartApi(data.anticipatedStart)
    }

    if (Array.isArray(data.assignedMemberHandles)) {
        payload.assignedMemberHandles = data.assignedMemberHandles
            .map(handle => String(handle)
                .trim())
            .filter(Boolean)
    }

    if (Array.isArray(data.assignmentDetails)) {
        payload.assignmentDetails = data.assignmentDetails
            .filter(assignment => assignment && assignment.memberHandle)
            .map(assignment => {
                const entry: Record<string, string> = {
                    memberHandle: String(assignment.memberHandle)
                        .trim(),
                }

                if (assignment.agreementRate) {
                    entry.agreementRate = String(assignment.agreementRate)
                        .trim()
                }

                if (assignment.endDate) {
                    entry.endDate = assignment.endDate
                }

                if (assignment.memberId !== undefined) {
                    entry.memberId = String(assignment.memberId)
                }

                if (assignment.otherRemarks) {
                    entry.otherRemarks = String(assignment.otherRemarks)
                        .trim()
                }

                if (assignment.startDate) {
                    entry.startDate = assignment.startDate
                }

                return entry
            })
    }

    if (data.compensationRange !== undefined) {
        payload.compensationRange = data.compensationRange
    }

    if (Array.isArray(data.countries)) {
        payload.countries = data.countries
    }

    if (data.description !== undefined) {
        payload.description = data.description
    }

    if (data.durationWeeks !== undefined) {
        payload.durationWeeks = Number(data.durationWeeks)
    }

    if (data.isPrivate !== undefined) {
        payload.isPrivate = data.isPrivate
    }

    if (data.projectId !== undefined) {
        payload.projectId = String(data.projectId)
    }

    if (data.requiredMemberCount !== undefined) {
        payload.requiredMemberCount = Number(data.requiredMemberCount)
    }

    if (data.role) {
        payload.role = toEngagementRoleApi(data.role)
    }

    const requiredSkills = normalizeSkillIds(data.skills)
    if (requiredSkills.length) {
        payload.requiredSkills = requiredSkills
    }

    if (data.status) {
        payload.status = toEngagementStatusApi(data.status)
    }

    if (Array.isArray(data.timezones)) {
        payload.timeZones = data.timezones
    }

    if (data.title !== undefined) {
        payload.title = data.title
    }

    if (data.workload) {
        payload.workload = toEngagementWorkloadApi(data.workload)
    }

    return payload
}

function normalizeEngagementRecord(data: Partial<Engagement>): Engagement {
    const normalized = normalizeEngagement({
        ...data,
        anticipatedStart: data.anticipatedStart
            ? fromEngagementAnticipatedStartApi(data.anticipatedStart)
            : 'IMMEDIATE',
        timezones: (data as {
            timeZones?: string[]
        }).timeZones || data.timezones || [],
    })

    return {
        ...normalized,
        assignments: Array.isArray(normalized.assignments)
            ? normalized.assignments
            : [],
    }
}

export async function fetchEngagements(
    filters: EngagementFilters = {},
    params: FetchEngagementsParams = {},
): Promise<FetchEngagementsResponse> {
    const query = createQuery(filters, params)
    const url = query
        ? `${ENGAGEMENTS_API_URL}?${query}`
        : ENGAGEMENTS_API_URL

    try {
        const response = await xhrGetPaginatedAsync<
            Engagement[] | BackendPaginatedResponse<Engagement>
        >(url)

        const normalizedResponse = normalizePaginatedResponse(
            response as EngagementResponse,
            params.page,
            params.perPage,
        )

        return {
            data: normalizedResponse.data
                .map(item => normalizeEngagementRecord(item)),
            metadata: {
                page: normalizedResponse.page,
                perPage: normalizedResponse.perPage,
                total: normalizedResponse.total,
                totalPages: normalizedResponse.totalPages,
            },
        }
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch engagements')
    }
}

export async function fetchEngagement(
    engagementId: number | string,
): Promise<Engagement> {
    try {
        const response = await xhrGetAsync<Engagement>(
            `${ENGAGEMENTS_API_URL}/${engagementId}`,
        )

        return normalizeEngagementRecord(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch engagement details')
    }
}

export async function createEngagement(
    data: EngagementUpsertData,
): Promise<Engagement> {
    try {
        const response = await xhrPostAsync<Record<string, unknown>, Engagement>(
            ENGAGEMENTS_API_URL,
            serializeEngagementPayload(data),
        )

        return normalizeEngagementRecord(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to create engagement')
    }
}

export async function updateEngagement(
    engagementId: number | string,
    data: EngagementUpsertData,
): Promise<Engagement> {
    try {
        const response = await xhrPutAsync<Record<string, unknown>, Engagement>(
            `${ENGAGEMENTS_API_URL}/${engagementId}`,
            serializeEngagementPayload(data),
        )

        return normalizeEngagementRecord(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to update engagement')
    }
}

export async function deleteEngagement(engagementId: number | string): Promise<void> {
    try {
        await xhrDeleteAsync(`${ENGAGEMENTS_API_URL}/${engagementId}`)
    } catch (error) {
        throw normalizeError(error, 'Failed to delete engagement')
    }
}

export async function updateEngagementAssignmentStatus(
    engagementId: number | string,
    assignmentId: number | string,
    status: string,
    reason?: string,
): Promise<Assignment> {
    try {
        return xhrPatchAsync(
            `${ENGAGEMENTS_API_URL}/${engagementId}/assignments/${assignmentId}/status`,
            {
                status,
                terminationReason: reason,
            },
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to update assignment status')
    }
}

export async function fetchEngagementFeedback(
    engagementId: number | string,
    assignmentId: number | string,
): Promise<EngagementFeedback[]> {
    try {
        return xhrGetAsync<EngagementFeedback[]>(
            `${ENGAGEMENTS_ROOT_API_URL}/${engagementId}/assignments/${assignmentId}/feedback`,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch engagement feedback')
    }
}

export async function createEngagementFeedback(
    engagementId: number | string,
    assignmentId: number | string,
    data: CreateEngagementFeedbackPayload,
): Promise<EngagementFeedback> {
    try {
        return xhrPostAsync<CreateEngagementFeedbackPayload, EngagementFeedback>(
            `${ENGAGEMENTS_ROOT_API_URL}/${engagementId}/assignments/${assignmentId}/feedback`,
            data,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to create engagement feedback')
    }
}

export async function generateEngagementFeedbackLink(
    engagementId: number | string,
    assignmentId: number | string,
    data: FeedbackLinkPayload,
): Promise<{
    expiresAt?: string
    feedbackUrl?: string
    secretToken?: string
}> {
    try {
        return xhrPostAsync<FeedbackLinkPayload, {
            expiresAt?: string
            feedbackUrl?: string
            secretToken?: string
        }>(
            `${ENGAGEMENTS_ROOT_API_URL}/${engagementId}/assignments/${assignmentId}/feedback/generate-link`,
            data,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to generate feedback link')
    }
}

export async function fetchMemberExperiences(
    engagementId: number | string,
    assignmentId: number | string,
): Promise<MemberExperience[]> {
    try {
        return xhrGetAsync<MemberExperience[]>(
            `${ENGAGEMENTS_ROOT_API_URL}/${engagementId}/assignments/${assignmentId}/experiences`,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch member experiences')
    }
}

export async function createMemberExperience(
    engagementId: number | string,
    assignmentId: number | string,
    data: CreateMemberExperiencePayload,
): Promise<MemberExperience> {
    try {
        return xhrPostAsync<CreateMemberExperiencePayload, MemberExperience>(
            `${ENGAGEMENTS_ROOT_API_URL}/${engagementId}/assignments/${assignmentId}/experiences`,
            data,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to create member experience')
    }
}
