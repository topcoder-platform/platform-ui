import { AxiosHeaders, AxiosResponse } from 'axios'

import { EnvironmentConfig } from '~/config'
import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrGlobalInstance,
    xhrPostAsync,
} from '~/libs/core'

import {
    ApiEnvelope,
    ApiListResponse,
    ChallengeOpportunity,
    ChallengeResource,
    ChallengeResourceRole,
    ChallengeSubmission,
    ChallengeTerm,
    CopilotOpportunity,
    EngagementOpportunity,
    OpportunityCellSummary,
    OpportunityFilters,
    OpportunityKind,
    OpportunityPage,
    OpportunitySummary,
    ReviewOpportunity,
} from '../models'

const V6_URL = EnvironmentConfig.API.V6

const DEFAULT_SUMMARY: OpportunitySummary = {
    competitions: { amount: 0, count: 0 },
    copilots: { amount: 0, count: 0 },
    engagements: { count: 0 },
    reviews: { count: 0 },
}

/**
 * Converts a value into a finite non-negative number.
 *
 * @param value API value that may be numeric or a serialized number.
 * @param fallback value used when conversion is not possible.
 * @returns normalized number.
 * @throws Does not throw.
 */
function toNumber(value: unknown, fallback: number = 0): number {
    const converted = Number(value)
    return Number.isFinite(converted) && converted >= 0 ? converted : fallback
}

/**
 * Reads a response header using case-insensitive Axios header access.
 *
 * @param headers Axios response headers.
 * @param names accepted header names in priority order.
 * @returns the first finite numeric header, or undefined.
 * @throws Does not throw.
 */
function readNumericHeader(headers: AxiosHeaders, names: string[]): number | undefined {
    const match = names
        .map(name => Number(headers.get(name)))
        .find(value => Number.isFinite(value) && value >= 0)
    return match
}

/**
 * Appends non-empty filters as repeatable query parameters.
 *
 * @param url destination URL being constructed.
 * @param name query parameter name.
 * @param values values to append.
 * @returns void.
 * @throws Does not throw.
 */
function appendValues(url: URL, name: string, values?: string[]): void {
    values?.filter(Boolean)
        .forEach(value => url.searchParams.append(name, value))
}

/**
 * Unwraps Topcoder's standard result envelope while accepting bare payloads.
 *
 * @param payload bare data or standard response envelope.
 * @returns unwrapped content.
 * @throws Does not throw.
 */
function unwrap<T>(payload: T | ApiEnvelope<T>): T {
    const envelope = payload as ApiEnvelope<T>
    return envelope.result?.content ?? envelope.content ?? payload as T
}

/**
 * Builds a consistent page model from a list response and its pagination headers.
 *
 * @param response Axios response containing a bare array or standard envelope.
 * @param fallbackPage requested page when the API omits headers.
 * @param fallbackPerPage requested page size when the API omits headers.
 * @returns normalized page model.
 * @throws Does not throw.
 */
function normalizePage<T>(
    response: AxiosResponse<T[] | ApiEnvelope<T[]> | ApiListResponse<T>>,
    fallbackPage: number,
    fallbackPerPage: number,
): OpportunityPage<T> {
    const listResponse = response.data as ApiListResponse<T>
    const unwrapped = unwrap(response.data as T[] | ApiEnvelope<T[]>)
    const items = Array.isArray(unwrapped) ? unwrapped : listResponse.data ?? []
    const envelope = response.data as ApiEnvelope<T[]>
    const metadata = envelope.result?.metadata ?? envelope.metadata ?? listResponse.meta ?? {}
    const headers = response.headers as AxiosHeaders
    const page = readNumericHeader(headers, ['x-page']) ?? toNumber(metadata.page, fallbackPage)
    const perPage = readNumericHeader(headers, ['x-per-page'])
        ?? toNumber(metadata.perPage ?? metadata.limit, fallbackPerPage)
    const total = readNumericHeader(headers, ['x-total', 'x-total-count'])
        ?? toNumber(metadata.total ?? metadata.totalCount, items.length)
    const totalPages = readNumericHeader(headers, ['x-total-pages'])
        ?? toNumber(metadata.totalPages, perPage > 0 ? Math.ceil(total / perPage) : 0)
    return { items, page, perPage, total, totalPages }
}

/**
 * Converts any supported aggregation response shape to the four-cell UI contract.
 *
 * @param payload aggregation service response.
 * @returns summaries for competitions, engagements, copilots, and reviews.
 * @throws Does not throw; missing cells use zero values.
 */
export function normalizeOpportunitySummary(payload: unknown): OpportunitySummary {
    const content = unwrap(payload as ApiEnvelope<Record<string, any>>) as Record<string, any>
    const source = content?.cells ?? content?.summary ?? content ?? {}
    const aliases: Record<OpportunityKind, string[]> = {
        competitions: ['competitions', 'challenges'],
        copilots: ['copilots', 'copilotOpportunities'],
        engagements: ['engagements'],
        reviews: ['reviews', 'reviewOpportunities'],
    }

    return (Object.keys(aliases) as OpportunityKind[])
        .reduce<OpportunitySummary>((result, kind) => {
            const raw = aliases[kind]
                .map(alias => source[alias])
                .find(Boolean) ?? {}
            const cell: OpportunityCellSummary = {
                count: toNumber(raw.count ?? raw.openCount ?? raw.total),
                ...(raw.amount !== undefined || raw.totalPrize !== undefined || raw.availablePayment !== undefined
                    ? { amount: toNumber(raw.amount ?? raw.totalPrize ?? raw.availablePayment) }
                    : {}),
                ...(raw.amountLabel ? { amountLabel: String(raw.amountLabel) } : {}),
                ...(raw.tag ? { tag: String(raw.tag) } : {}),
            }
            result[kind] = cell
            return result
        }, { ...DEFAULT_SUMMARY })
}

/**
 * Loads all four headline cells in one request to opportunities-api-v6.
 *
 * @returns current public opportunity totals and available amounts.
 * @throws Propagates API/network errors to the page error boundary.
 */
export async function getOpportunitySummary(): Promise<OpportunitySummary> {
    const response = await xhrGetAsync<unknown>(`${V6_URL}/opportunities/summary`)
    return normalizeOpportunitySummary(response)
}

/**
 * Loads one filtered page from the owning domain API.
 *
 * @param kind active opportunity type.
 * @param filters search, facets, sorting, and pagination values.
 * @returns normalized page with list data and total metadata.
 * @throws Propagates API/network errors to the caller.
 */
export async function getOpportunityPage(
    kind: OpportunityKind,
    filters: OpportunityFilters,
): Promise<OpportunityPage<any>> {
    const page = Math.max(1, filters.page)
    const perPage = Math.max(1, filters.perPage)
    let endpoint: string
    const url = new URL(V6_URL)

    if (kind === 'competitions') {
        endpoint = `${V6_URL}/challenges`
        url.pathname = new URL(endpoint).pathname
        url.searchParams.set('page', String(page))
        url.searchParams.set('perPage', String(perPage))
        url.searchParams.set('sortBy', filters.sort || 'updatedAt')
        url.searchParams.set('sortOrder', 'desc')
        if (filters.search) url.searchParams.set('search', filters.search)
        const competitionStatuses = filters.statuses?.includes('REGISTRATION')
            ? ['ACTIVE']
            : filters.statuses
        appendValues(url, 'status', competitionStatuses)
        if (filters.statuses?.includes('REGISTRATION')) url.searchParams.set('phase', 'Registration')
        appendValues(url, 'track', filters.tracks)
        appendValues(url, 'type', filters.types)
        appendValues(url, 'tags', filters.skills)
        if (filters.applied && filters.memberId) url.searchParams.set('memberId', filters.memberId)
    } else if (kind === 'engagements') {
        endpoint = `${V6_URL}/engagements/engagements`
        url.pathname = new URL(endpoint).pathname
        url.searchParams.set('page', String(page))
        url.searchParams.set('perPage', String(perPage))
        if (filters.search) url.searchParams.set('search', filters.search)
        appendValues(url, 'status', filters.statuses)
        appendValues(url, 'requiredSkills', filters.skills)
        if (filters.applied) url.searchParams.set('appliedByMe', 'true')
    } else if (kind === 'copilots') {
        endpoint = `${V6_URL}/projects/copilots/opportunities`
        url.pathname = new URL(endpoint).pathname
        url.searchParams.set('page', String(page))
        url.searchParams.set('pageSize', String(perPage))
        url.searchParams.set('sort', filters.sort || 'createdAt desc')
        if (filters.search) url.searchParams.set('search', filters.search)
        appendValues(url, 'status', filters.statuses)
        appendValues(url, 'type', filters.types)
        appendValues(url, 'skills', filters.skills)
        if (filters.applied) url.searchParams.set('myApplications', 'true')
    } else {
        endpoint = `${V6_URL}/review-opportunities/search`
        url.pathname = new URL(endpoint).pathname
        url.searchParams.set('offset', String((page - 1) * perPage))
        url.searchParams.set('limit', String(perPage))
        url.searchParams.set('sortBy', filters.sort || 'startDate')
        url.searchParams.set('sortOrder', 'asc')
        if (filters.search) url.searchParams.set('search', filters.search)
        appendValues(url, 'statuses', filters.statuses)
        appendValues(url, 'tracks', filters.tracks)
        appendValues(url, 'types', filters.types)
        if (filters.applied) url.searchParams.set('appliedByMe', 'true')
    }

    const response = await xhrGlobalInstance.get(url.toString()) as AxiosResponse<
        any[] | ApiEnvelope<any[]> | ApiListResponse<any>
    >
    return normalizePage(response, page, perPage)
}

/**
 * Loads a complete challenge record for the Opportunities detail route.
 *
 * @param challengeId challenge UUID.
 * @returns challenge details.
 * @throws Propagates not-found, visibility, and network errors.
 */
export function getChallengeOpportunity(challengeId: string): Promise<ChallengeOpportunity> {
    return xhrGetAsync<ChallengeOpportunity>(`${V6_URL}/challenges/${encodeURIComponent(challengeId)}`)
}

/**
 * Loads a review opportunity, including challenge summary and caller eligibility.
 *
 * @param opportunityId review opportunity UUID.
 * @returns review opportunity details.
 * @throws Propagates not-found and network errors.
 */
export async function getReviewOpportunity(opportunityId: string): Promise<ReviewOpportunity> {
    const response = await xhrGetAsync<ReviewOpportunity | ApiEnvelope<ReviewOpportunity>>(
        `${V6_URL}/review-opportunities/${encodeURIComponent(opportunityId)}`,
    )
    return unwrap(response)
}

/**
 * Submits an application for a single review opportunity.
 *
 * @param opportunityId review opportunity UUID.
 * @param role reviewer role selected by the member.
 * @returns created application response.
 * @throws Propagates validation, role, conflict, and network errors.
 */
export interface ReviewApplicationResponse {
    id?: string
    status?: string
}

export function applyToReviewOpportunity(
    opportunityId: string,
    role: string = 'REVIEWER',
): Promise<ReviewApplicationResponse> {
    return xhrPostAsync<{ opportunityId: string; role: string }, ReviewApplicationResponse>(
        `${V6_URL}/review-applications`,
        { opportunityId, role },
    )
}

export type CompetitionPage = OpportunityPage<ChallengeOpportunity>
export type EngagementPage = OpportunityPage<EngagementOpportunity>
export type CopilotPage = OpportunityPage<CopilotOpportunity>
export type ReviewPage = OpportunityPage<ReviewOpportunity>

interface SubmissionApiResponse {
    data?: ChallengeSubmission[]
    meta?: {
        page?: number
        perPage?: number
        total?: number
        totalPages?: number
    }
    result?: {
        content?: ChallengeSubmission[]
        metadata?: Record<string, any>
    }
}

/**
 * Loads one submissions page for a challenge detail tab.
 *
 * @param challengeId challenge UUID.
 * @param page one-based page.
 * @param perPage page size.
 * @returns normalized submissions page.
 * @throws Propagates Review API and network errors.
 */
export async function getChallengeSubmissions(
    challengeId: string,
    page: number,
    perPage: number,
    memberId?: string,
): Promise<OpportunityPage<ChallengeSubmission>> {
    const url = new URL(`${V6_URL}/submissions`)
    url.searchParams.set('challengeId', challengeId)
    url.searchParams.set('page', String(page))
    url.searchParams.set('perPage', String(perPage))
    if (memberId) url.searchParams.set('memberId', memberId)
    const response = await xhrGetAsync<SubmissionApiResponse | ChallengeSubmission[]>(url.toString())
    if (Array.isArray(response)) {
        return {
            items: response,
            page,
            perPage,
            total: response.length,
            totalPages: response.length ? 1 : 0,
        }
    }

    const items = response.data ?? response.result?.content ?? []
    const metadata = response.meta ?? response.result?.metadata ?? {}
    const total = toNumber(metadata.total, items.length)
    const normalizedPerPage = toNumber(metadata.perPage, perPage)
    return {
        items,
        page: toNumber(metadata.page, page),
        perPage: normalizedPerPage,
        total,
        totalPages: toNumber(
            metadata.totalPages,
            normalizedPerPage > 0 ? Math.ceil(total / normalizedPerPage) : 0,
        ),
    }
}

/**
 * Returns the public Review API preview endpoint for a released design submission.
 *
 * @param submissionId submission UUID.
 * @returns absolute preview URL; the API redirects to an immutable Payload asset.
 * @throws Does not throw.
 */
export function getSubmissionPreviewUrl(submissionId: string): string {
    return `${V6_URL}/submissions/${encodeURIComponent(submissionId)}/preview`
}

/**
 * Loads resources belonging to a challenge, optionally scoped to one member.
 *
 * @param challengeId challenge UUID.
 * @param memberId optional authenticated member ID.
 * @returns challenge resources visible to the caller.
 * @throws Propagates Resource API and network errors.
 */
export async function getChallengeResources(
    challengeId: string,
    memberId?: string,
): Promise<ChallengeResource[]> {
    const url = new URL(`${V6_URL}/resources`)
    url.searchParams.set('challengeId', challengeId)
    url.searchParams.set('page', '1')
    url.searchParams.set('perPage', '500')
    if (memberId) url.searchParams.set('memberId', memberId)
    const response = await xhrGetAsync<ChallengeResource[] | ApiEnvelope<ChallengeResource[]>>(url.toString())
    return unwrap(response)
}

/**
 * Resolves the canonical Submitter role used by challenge registration.
 *
 * @returns Submitter resource role.
 * @throws Error when Resource API does not expose a Submitter role.
 */
async function getSubmitterRole(): Promise<ChallengeResourceRole> {
    const response = await xhrGetAsync<ChallengeResourceRole[] | ApiEnvelope<ChallengeResourceRole[]>>(
        `${V6_URL}/resource-roles?page=1&perPage=500`,
    )
    const role = unwrap(response)
        .find(item => item.name.trim()
            .toLowerCase() === 'submitter')
    if (!role) throw new Error('The Submitter resource role is not available.')
    return role
}

/**
 * Registers the authenticated profile as a challenge submitter.
 *
 * @param challengeId challenge UUID.
 * @param memberHandle authenticated member handle.
 * @returns created resource.
 * @throws Propagates role resolution, terms, conflict, and network errors.
 */
export async function registerForChallenge(
    challengeId: string,
    memberHandle: string,
): Promise<ChallengeResource> {
    const role = await getSubmitterRole()
    return xhrPostAsync<{
        challengeId: string
        memberHandle: string
        roleId: string
    }, ChallengeResource>(`${V6_URL}/resources`, {
        challengeId,
        memberHandle,
        roleId: role.id,
    })
}

/**
 * Removes an authenticated member's submitter resource.
 *
 * @param resourceId resource UUID resolved from the member-scoped list.
 * @returns void after deletion.
 * @throws Propagates Resource API authorization and network errors.
 */
export async function unregisterFromChallenge(resourceId: string): Promise<void> {
    await xhrDeleteAsync(`${V6_URL}/resources/${encodeURIComponent(resourceId)}`)
}

/**
 * Electronically agrees to every unaccepted term required by a challenge.
 *
 * @param terms challenge term references.
 * @returns void after all agreements succeed.
 * @throws Propagates Terms API validation and network errors.
 */
export async function agreeToChallengeTerms(terms: ChallengeTerm[]): Promise<void> {
    const required = terms.filter(term => term.id && !term.agreed)
    await Promise.all(required.map(term => xhrPostAsync<Record<string, never>, unknown>(
        `${EnvironmentConfig.API.V5}/terms/${encodeURIComponent(term.id as string)}/agree`,
        {},
    )))
}
