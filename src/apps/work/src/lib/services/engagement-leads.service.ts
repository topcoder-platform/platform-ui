import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrPatchAsync,
    xhrPostAsync,
    xhrPutAsync,
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
import type {
    EngagementLeadCalculation,
    EngagementLeadCalculationInput,
} from '../models/EngagementLeadCalculation.model'

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
    value?: string | number | string[],
): void {
    // Lists go out comma-separated, which the API reads as several values.
    const normalized = Array.isArray(value) ? value.join(',') : value

    if (normalized === undefined || normalized === null || normalized === '') {
        return
    }

    params.set(key, String(normalized))
}

export const fetchEngagementLeads = async (
    filters: EngagementLeadFilters = {},
): Promise<EngagementLeadListResponse> => {
    const params = new URLSearchParams()

    appendFilterParam(params, 'page', filters.page)
    appendFilterParam(params, 'perPage', filters.perPage)
    appendFilterParam(params, 'leadType', filters.leadType)
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

/**
 * Updates a lead's status.
 * @param leadId Lead to update.
 * @param status New status.
 * @param reason Why the lead is rejected; the API requires it for REJECTED.
 */
export const updateEngagementLeadStatus = async (
    leadId: string,
    status: string,
    reason?: string,
): Promise<EngagementLead> => (
    xhrPatchAsync<{ reason?: string, status: string }, EngagementLead>(
        `${LEADS_URL}/${leadId}/status`,
        reason === undefined ? { status } : { reason, status },
    )
)

export const addEngagementLeadNote = async (
    leadId: string,
    content: string,
): Promise<EngagementLead> => (
    xhrPostAsync<{ content: string }, EngagementLead>(
        `${LEADS_URL}/${leadId}/notes`,
        { content },
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

/** Cost calculations saved for a lead, oldest first. */
export const fetchEngagementLeadCalculations = async (
    leadId: string,
): Promise<EngagementLeadCalculation[]> => (
    xhrGetAsync<EngagementLeadCalculation[]>(`${LEADS_URL}/${leadId}/calculations`)
)

export const createEngagementLeadCalculation = async (
    leadId: string,
    input: EngagementLeadCalculationInput,
): Promise<EngagementLeadCalculation> => (
    xhrPostAsync<EngagementLeadCalculationInput, EngagementLeadCalculation>(
        `${LEADS_URL}/${leadId}/calculations`,
        input,
    )
)

/** Overwrites a saved calculation; its previous values are not kept. */
export const updateEngagementLeadCalculation = async (
    leadId: string,
    calculationId: string,
    input: EngagementLeadCalculationInput,
): Promise<EngagementLeadCalculation> => (
    xhrPutAsync<EngagementLeadCalculationInput, EngagementLeadCalculation>(
        `${LEADS_URL}/${leadId}/calculations/${calculationId}`,
        input,
    )
)

export const deleteEngagementLeadCalculation = async (
    leadId: string,
    calculationId: string,
): Promise<void> => {
    await xhrDeleteAsync<unknown>(`${LEADS_URL}/${leadId}/calculations/${calculationId}`)
}
