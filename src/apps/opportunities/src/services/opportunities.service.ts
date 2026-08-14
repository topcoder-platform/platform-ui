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
 * Builds the owning API URL for one opportunity list request.
 *
 * UI sort choices are intentionally semantic so each domain receives the
 * field, direction, and grouping parameters that actually implement the label.
 * Track values are already normalized by the filter panel for the selected
 * domain; copilot tracks map to its opportunity `type` enum. A competition's
 * `memberId` and `resourceRoleId` are emitted together so Challenge API can
 * apply Submitter membership before filtering, sorting, and pagination.
 * Competition free text is emitted only through `search`; a hidden `tags`
 * filter would turn the authored unified search into an unintended AND query.
 *
 * @param kind active opportunity type.
 * @param filters search, facets, sorting, and pagination values.
 * @returns absolute owning API URL.
 * @throws Does not throw for supported opportunity kinds.
 */
export function buildOpportunityPageUrl(
    kind: OpportunityKind,
    filters: OpportunityFilters,
): string {
    const page = Math.max(1, filters.page)
    const perPage = Math.max(1, filters.perPage)
    let endpoint: string
    const url = new URL(V6_URL)

    if (kind === 'competitions') {
        endpoint = `${V6_URL}/challenges`
        url.pathname = new URL(endpoint).pathname
        url.searchParams.set('page', String(page))
        url.searchParams.set('perPage', String(perPage))
        const startingSoon = filters.sort === 'startingSoon'
        url.searchParams.set('sortBy', startingSoon ? 'startDate' : 'updatedAt')
        url.searchParams.set('sortOrder', startingSoon ? 'asc' : 'desc')
        if (filters.search) url.searchParams.set('search', filters.search)
        const competitionStatuses = filters.statuses?.includes('REGISTRATION')
            ? ['ACTIVE']
            : filters.statuses
        appendValues(url, 'status', competitionStatuses)
        if (filters.statuses?.includes('REGISTRATION')) {
            url.searchParams.set('currentPhaseName', 'Registration')
        }

        appendValues(url, 'tracks', filters.tracks)
        appendValues(url, 'types', filters.types)
        if (filters.applied && filters.memberId && filters.resourceRoleId) {
            url.searchParams.set('memberId', filters.memberId)
            url.searchParams.set('resourceRoleId', filters.resourceRoleId)
        }
    } else if (kind === 'engagements') {
        endpoint = `${V6_URL}/engagements/engagements`
        url.pathname = new URL(endpoint).pathname
        url.searchParams.set('page', String(page))
        url.searchParams.set('perPage', String(perPage))
        const startingSoon = filters.sort === 'startingSoon'
        url.searchParams.set('sortBy', startingSoon ? 'anticipatedStart' : 'createdAt')
        url.searchParams.set('sortOrder', startingSoon ? 'asc' : 'desc')
        if (filters.search) url.searchParams.set('search', filters.search)
        if (filters.statuses?.[0]) url.searchParams.set('status', filters.statuses[0])
        appendValues(url, 'requiredSkills', filters.skills)
        if (filters.applied) url.searchParams.set('appliedByMe', 'true')
    } else if (kind === 'copilots') {
        endpoint = `${V6_URL}/projects/copilots/opportunities`
        url.pathname = new URL(endpoint).pathname
        url.searchParams.set('page', String(page))
        url.searchParams.set('pageSize', String(perPage))
        const startingSoon = filters.sort === 'startingSoon'
        url.searchParams.set('sort', startingSoon ? 'startDate asc' : 'createdAt desc')
        url.searchParams.set('noGrouping', 'true')
        if (filters.search) url.searchParams.set('search', filters.search)
        appendValues(url, 'status', filters.statuses)
        appendValues(url, 'type', [...(filters.tracks ?? []), ...(filters.types ?? [])])
        appendValues(url, 'skills', filters.skills)
        if (filters.applied) url.searchParams.set('applied', 'true')
    } else {
        endpoint = `${V6_URL}/review-opportunities/search`
        url.pathname = new URL(endpoint).pathname
        url.searchParams.set('offset', String((page - 1) * perPage))
        url.searchParams.set('limit', String(perPage))
        const highestPayment = filters.sort === 'highestPayment'
        url.searchParams.set('sortBy', highestPayment ? 'basePayment' : 'startDate')
        url.searchParams.set('sortOrder', highestPayment ? 'desc' : 'asc')
        if (filters.search) url.searchParams.set('search', filters.search)
        appendValues(url, 'status', filters.statuses)
        appendValues(url, 'tracks', filters.tracks)
        appendValues(url, 'opportunityTypes', filters.types)
        if (filters.applied) url.searchParams.set('appliedByMe', 'true')
    }

    return url.toString()
}

/**
 * Loads one filtered page from the owning domain API. For “My competitions,”
 * this first resolves the canonical Submitter role and then performs one
 * globally filtered, sorted, and paginated Challenge API request.
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
    if (kind === 'competitions' && filters.applied && filters.memberId) {
        const submitterRole = await getSubmitterRole()
        const roleScopedFilters: OpportunityFilters = {
            ...filters,
            resourceRoleId: submitterRole.id,
        }
        const response = await xhrGlobalInstance.get(buildOpportunityPageUrl(kind, roleScopedFilters)) as AxiosResponse<
            any[] | ApiEnvelope<any[]> | ApiListResponse<any>
        >
        return normalizePage(response, page, perPage)
    }

    const response = await xhrGlobalInstance.get(buildOpportunityPageUrl(kind, filters)) as AxiosResponse<
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
        totalCount?: number
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
    const total = toNumber(metadata.total ?? metadata.totalCount, items.length)
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
 * Loads the public, release-gated Design preview page for a challenge.
 * Review API applies challenge visibility, whitelist, and phase gates before
 * returning immutable Payload asset URLs, so anonymous visitors can browse
 * only previews that are genuinely public.
 *
 * @param challengeId challenge UUID.
 * @param page one-based page.
 * @param perPage page size.
 * @returns normalized released-preview page.
 * @throws Propagates Review API visibility and network errors.
 */
export async function getChallengeSubmissionPreviews(
    challengeId: string,
    page: number,
    perPage: number,
): Promise<OpportunityPage<ChallengeSubmission>> {
    const url = new URL(`${V6_URL}/submissions/previews`)
    url.searchParams.set('challengeId', challengeId)
    url.searchParams.set('page', String(page))
    url.searchParams.set('perPage', String(perPage))
    const response = await xhrGetAsync<SubmissionApiResponse>(url.toString())
    const items = response.data ?? response.result?.content ?? []
    const metadata = response.meta ?? response.result?.metadata ?? {}
    const normalizedPerPage = toNumber(metadata.perPage, perPage)
    const total = toNumber(metadata.totalCount ?? metadata.total, items.length)
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
 * Loads resources belonging to a challenge, optionally scoped to one member.
 *
 * @param challengeId challenge UUID.
 * @param page one-based Resource API page.
 * @param perPage bounded page size.
 * @param memberId optional authenticated member ID.
 * @param roleId optional canonical resource-role ID.
 * @returns paginated challenge resources visible to the caller.
 * @throws Propagates Resource API and network errors.
 */
export async function getChallengeResources(
    challengeId: string,
    page: number,
    perPage: number,
    memberId?: string,
    roleId?: string,
): Promise<OpportunityPage<ChallengeResource>> {
    const url = new URL(`${V6_URL}/resources`)
    url.searchParams.set('challengeId', challengeId)
    url.searchParams.set('page', String(Math.max(1, page)))
    url.searchParams.set('perPage', String(Math.max(1, perPage)))
    if (memberId) url.searchParams.set('memberId', memberId)
    if (roleId) url.searchParams.set('roleId', roleId)
    const response = await xhrGlobalInstance.get(url.toString()) as AxiosResponse<
        ChallengeResource[] | ApiEnvelope<ChallengeResource[]> | ApiListResponse<ChallengeResource>
    >
    return normalizePage(response, page, perPage)
}

/**
 * Resolves the canonical Submitter role used by challenge registration.
 *
 * @returns Submitter resource role.
 * @throws Error when Resource API does not expose a Submitter role.
 */
export async function getSubmitterRole(): Promise<ChallengeResourceRole> {
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
 * Loads only Submitter resources for a challenge instead of treating copilot,
 * reviewer, observer, and manager resources as registrations.
 *
 * @param challengeId challenge UUID.
 * @param page one-based Resource API page.
 * @param perPage bounded page size.
 * @param memberId optional authenticated member ID.
 * @returns paginated resources whose role matches the canonical Submitter role.
 * @throws Propagates role resolution, Resource API, and network errors.
 */
export async function getChallengeSubmitters(
    challengeId: string,
    page: number,
    perPage: number,
    memberId?: string,
): Promise<OpportunityPage<ChallengeResource>> {
    const role = await getSubmitterRole()
    return getChallengeResources(challengeId, page, perPage, memberId, role.id)
}

/**
 * Resolves the authenticated member's own canonical Submitter resource.
 * The response is rechecked defensively so a broad or stale Resource API page
 * can never enable unregister for another member or another resource role.
 *
 * @param challengeId challenge UUID.
 * @param memberId authenticated member ID.
 * @returns caller-owned Submitter resource, or undefined when absent/mismatched.
 * @throws Propagates role resolution, authorization, and Resource API errors.
 */
export async function getChallengeRegistration(
    challengeId: string,
    memberId: string,
): Promise<ChallengeResource | undefined> {
    const role = await getSubmitterRole()
    const resources = await getChallengeResources(challengeId, 1, 1, memberId, role.id)
    return resources.items.find(resource => (
        String(resource.memberId) === memberId && resource.roleId === role.id
    ))
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
 * Electronically agrees to every unaccepted, electronically agreeable term.
 * Terms with an explicit DocuSign or non-electronic agreement type are left
 * untouched and must be completed through their external agreement flow.
 *
 * @param terms challenge term references.
 * @returns void after all agreements succeed.
 * @throws Propagates Terms API validation and network errors.
 */
export async function agreeToChallengeTerms(terms: ChallengeTerm[]): Promise<void> {
    const required = terms.filter(term => term.id
        && !term.agreed
        && !term.docusignTemplateId
        && (!term.agreeabilityType || term.agreeabilityType.toLowerCase() === 'electronically-agreeable'))
    await Promise.all(required.map(term => xhrPostAsync<Record<string, never>, unknown>(
        `${EnvironmentConfig.API.V5}/terms/${encodeURIComponent(term.id as string)}/agree`,
        {},
    )))
}

interface LegacyTermsSearchResponse {
    result?: ChallengeTerm[]
}

interface DocuSignViewResponse {
    recipientViewUrl?: string
}

/**
 * Loads the complete title, agreement type, URL, and body for one challenge
 * term reference from the v5 Terms API.
 *
 * Numeric legacy IDs use the legacyId search route; UUIDs use the canonical
 * detail route. Reference fields are retained when the detail omits them.
 *
 * @param term lightweight challenge term reference.
 * @returns complete term details, or the original reference when it has no ID.
 * @throws Error when a legacy ID is not found; otherwise propagates API errors.
 */
export async function getChallengeTermDetails(term: ChallengeTerm): Promise<ChallengeTerm> {
    if (!term.id) return term
    let details: ChallengeTerm
    if (/^[\d]{5,8}$/.test(term.id)) {
        const response = await xhrGetAsync<LegacyTermsSearchResponse>(
            `${EnvironmentConfig.API.V5}/terms?legacyId=${encodeURIComponent(term.id)}`,
        )
        const match = response.result?.[0]
        if (!match) throw new Error(`Challenge term ${term.id} was not found.`)
        details = match
    } else {
        details = await xhrGetAsync<ChallengeTerm>(
            `${EnvironmentConfig.API.V5}/terms/${encodeURIComponent(term.id)}`,
        )
    }

    return { ...term, ...details, agreed: details.agreed ?? term.agreed }
}

/**
 * Resolves all lightweight challenge term references for modal display.
 *
 * @param terms lightweight terms included with a Challenge API response.
 * @returns complete Terms API records in challenge order.
 * @throws Propagates any individual term detail failure.
 */
export function getChallengeTermsDetails(terms: ChallengeTerm[]): Promise<ChallengeTerm[]> {
    return Promise.all(terms.map(getChallengeTermDetails))
}

/**
 * Loads complete details only for challenge terms assigned to the canonical
 * Submitter role. Challenge responses can also contain reviewer, copilot, and
 * manager terms; those must not be displayed or agreed during registration.
 *
 * @param terms lightweight role-scoped references from Challenge API.
 * @returns complete Submitter term records in challenge order.
 * @throws Propagates Resource Role or Terms API failures.
 */
export async function getChallengeSubmitterTermsDetails(
    terms: ChallengeTerm[],
): Promise<ChallengeTerm[]> {
    const submitterRole = await getSubmitterRole()
    return getChallengeTermsDetails(terms.filter(term => term.roleId === submitterRole.id))
}

/**
 * Creates the authenticated DocuSign recipient view for an external challenge
 * agreement.
 *
 * @param templateId Terms API DocuSign template identifier.
 * @param returnUrl challenge route restored after signing.
 * @returns recipient URL supplied by Terms API.
 * @throws Error when Terms API omits the URL; otherwise propagates API errors.
 */
export async function getChallengeTermDocuSignUrl(
    templateId: string | number,
    returnUrl: string,
): Promise<string> {
    const response = await xhrPostAsync<{
        returnUrl: string
        templateId: string | number
    }, DocuSignViewResponse>(`${EnvironmentConfig.API.V5}/terms/docusignViewURL`, {
        returnUrl,
        templateId,
    })
    if (!response.recipientViewUrl) throw new Error('Terms API did not return a DocuSign URL.')
    return response.recipientViewUrl
}
