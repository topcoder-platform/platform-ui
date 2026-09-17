import {
    xhrGetAsync,
    xhrPatchAsync,
} from '~/libs/core'

import {
    ENGAGEMENTS_ROOT_API_URL,
} from '../constants'
import type {
    EngagementLead,
    EngagementLeadFilters,
    EngagementLeadListResponse,
    EngagementLeadPrefill,
} from '../models/EngagementLead.model'

const LEADS_URL = `${ENGAGEMENTS_ROOT_API_URL}/engagement-leads`

interface BackendLeadListResponse {
    data: EngagementLead[]
    meta: {
        page: number
        perPage: number
        totalCount: number
        totalPages: number
    }
}

function appendFilterParam(
    params: URLSearchParams,
    key: string,
    value?: string | number,
): void {
    if (value === undefined || value === null || value === '') {
        return
    }

    params.set(key, String(value))
}

export const fetchEngagementLeads = async (
    filters: EngagementLeadFilters = {},
): Promise<EngagementLeadListResponse> => {
    const params = new URLSearchParams()

    appendFilterParam(params, 'page', filters.page)
    appendFilterParam(params, 'perPage', filters.perPage)
    appendFilterParam(params, 'accountName', filters.accountName)
    appendFilterParam(params, 'smu', filters.smu)
    appendFilterParam(params, 'engagementModel', filters.engagementModel)
    appendFilterParam(params, 'roleTitle', filters.roleTitle)
    appendFilterParam(params, 'experienceLevel', filters.experienceLevel)
    appendFilterParam(params, 'priority', filters.priority)
    appendFilterParam(params, 'status', filters.status)
    appendFilterParam(params, 'statusGroup', filters.statusGroup)
    appendFilterParam(params, 'sortBy', filters.sortBy)
    appendFilterParam(params, 'sortOrder', filters.sortOrder)

    const query = params.toString()
    const url = query ? `${LEADS_URL}?${query}` : LEADS_URL

    const response = await xhrGetAsync<BackendLeadListResponse>(url)

    return {
        data: response.data || [],
        meta: response.meta || {
            page: filters.page || 1,
            perPage: filters.perPage || 20,
            totalCount: 0,
            totalPages: 1,
        },
    }
}

export const fetchEngagementLeadById = async (
    leadId: string,
): Promise<EngagementLead> => (
    xhrGetAsync<EngagementLead>(`${LEADS_URL}/${leadId}`)
)

export const fetchEngagementLeadPrefill = async (
    leadId: string,
): Promise<EngagementLeadPrefill> => (
    xhrGetAsync<EngagementLeadPrefill>(`${LEADS_URL}/${leadId}/prefill`)
)

export const updateEngagementLeadStatus = async (
    leadId: string,
    status: string,
): Promise<EngagementLead> => (
    xhrPatchAsync<{ status: string }, EngagementLead>(
        `${LEADS_URL}/${leadId}/status`,
        { status },
    )
)

export const markEngagementLeadConverted = async (
    leadId: string,
    engagementId: string,
): Promise<EngagementLead> => (
    xhrPatchAsync<{ engagementId: string }, EngagementLead>(
        `${LEADS_URL}/${leadId}/convert`,
        { engagementId },
    )
)
