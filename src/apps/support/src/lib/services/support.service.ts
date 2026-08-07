/** Authenticated HTTP client for support-api-v6. */
import { EnvironmentConfig } from '~/config'
import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    CreateSupportResponseRequest,
    CreateSupportTicketRequest,
    MemberAutocompleteOption,
    SupportTicketDetail,
    SupportTicketPage,
    SupportTicketQuery,
} from '../models'

export const SUPPORT_API_BASE = `${EnvironmentConfig.API.V6}/support`

/**
 * Builds an allowlisted, safely encoded ticket-list URL.
 *
 * @param query supported ticket filters and pagination.
 * @returns absolute support-api-v6 URL.
 * @throws Does not throw.
 */
export function buildTicketListUrl(query: SupportTicketQuery): string {
    const params = new URLSearchParams()
    params.set('status', query.status)
    params.set('page', String(query.page))
    params.set('perPage', String(query.perPage))

    const optionalValues = {
        challengeId: query.challengeId,
        description: query.description,
        memberHandle: query.memberHandle,
    }
    Object.entries(optionalValues)
        .forEach(([key, value]) => {
            if (value?.trim()) {
                params.set(key, value.trim())
            }
        })

    return `${SUPPORT_API_BASE}/tickets?${params.toString()}`
}

/**
 * Encodes an opaque ticket identifier as one path segment.
 *
 * @param ticketId opaque ticket identifier.
 * @returns encoded path segment.
 * @throws Does not throw.
 */
function encodeTicketId(ticketId: string): string {
    return encodeURIComponent(ticketId)
}

/**
 * Lists tickets visible to the authenticated user.
 *
 * @param query status, pagination, and allowed staff filters.
 * @returns paginated ticket summaries.
 * @throws The returned promise rejects when the request fails.
 */
export function getSupportTickets(query: SupportTicketQuery): Promise<SupportTicketPage> {
    return xhrGetAsync(buildTicketListUrl(query))
}

/**
 * Creates a ticket for the authenticated member.
 *
 * @param request optional challenge ID and required description.
 * @returns created ticket detail.
 * @throws The returned promise rejects when the request fails.
 */
export function createSupportTicket(request: CreateSupportTicketRequest): Promise<SupportTicketDetail> {
    return xhrPostAsync(`${SUPPORT_API_BASE}/tickets`, request)
}

/**
 * Gets one ticket authorized for the authenticated user.
 *
 * @param ticketId ticket identifier.
 * @returns ticket detail.
 * @throws The returned promise rejects when the request fails.
 */
export function getSupportTicket(ticketId: string): Promise<SupportTicketDetail> {
    return xhrGetAsync(`${SUPPORT_API_BASE}/tickets/${encodeTicketId(ticketId)}`)
}

/**
 * Adds a markdown response to a ticket; an owner reply can reopen a closed ticket.
 *
 * @param ticketId ticket identifier.
 * @param request response markdown.
 * @returns updated ticket detail.
 * @throws The returned promise rejects when the request fails.
 */
export function addSupportResponse(
    ticketId: string,
    request: CreateSupportResponseRequest,
): Promise<SupportTicketDetail> {
    return xhrPostAsync(
        `${SUPPORT_API_BASE}/tickets/${encodeTicketId(ticketId)}/responses`,
        request,
    )
}

/**
 * Assigns the authenticated Support Team user to a ticket.
 *
 * @param ticketId ticket identifier.
 * @returns updated ticket detail.
 * @throws The returned promise rejects when the request fails.
 */
export function assignSupportTicketToMe(ticketId: string): Promise<SupportTicketDetail> {
    return xhrPostAsync(
        `${SUPPORT_API_BASE}/tickets/${encodeTicketId(ticketId)}/assignees/me`,
        {},
    )
}

/**
 * Removes the authenticated Support Team user from a ticket.
 *
 * @param ticketId ticket identifier.
 * @returns the completed request.
 * @throws The returned promise rejects when the request fails.
 */
export function unassignSupportTicketFromMe(ticketId: string): Promise<void> {
    return xhrDeleteAsync(
        `${SUPPORT_API_BASE}/tickets/${encodeTicketId(ticketId)}/assignees/me`,
    )
}

/**
 * Marks a ticket and its visible responses read for the authenticated user.
 *
 * @param ticketId ticket identifier.
 * @returns the completed request.
 * @throws The returned promise rejects when the request fails.
 */
export function markSupportTicketRead(ticketId: string): Promise<void> {
    return xhrPostAsync(
        `${SUPPORT_API_BASE}/tickets/${encodeTicketId(ticketId)}/read`,
        {},
    )
}

/**
 * Closes an open ticket as the authenticated Support Team user.
 *
 * @param ticketId ticket identifier.
 * @returns updated ticket detail.
 * @throws The returned promise rejects when the request fails.
 */
export function closeSupportTicket(ticketId: string): Promise<SupportTicketDetail> {
    return xhrPostAsync(
        `${SUPPORT_API_BASE}/tickets/${encodeTicketId(ticketId)}/close`,
        {},
    )
}

/**
 * Searches member handles for the staff closed-ticket filter.
 *
 * @param term partial member handle.
 * @returns normalized member suggestions.
 * @throws The returned promise rejects when the request fails.
 */
export async function autocompleteMemberHandles(term: string): Promise<MemberAutocompleteOption[]> {
    const url = `${EnvironmentConfig.API.V6}/members/autocomplete?term=${encodeURIComponent(term.trim())}`
    const response = await xhrGetAsync<
        MemberAutocompleteOption[] | { data: MemberAutocompleteOption[] }
    >(url)

    const members = Array.isArray(response) ? response : response.data
    return members.map(member => ({
        ...member,
        userId: String(member.userId),
    }))
}
