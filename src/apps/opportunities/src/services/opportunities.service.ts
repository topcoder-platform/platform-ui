import { AxiosHeaders, AxiosResponse } from 'axios'

import { EnvironmentConfig } from '~/config'
import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrGlobalInstance,
    xhrPostAsync,
    xhrRequestAsync,
} from '~/libs/core'

import {
    ApiEnvelope,
    ApiListResponse,
    ChallengeOpportunity,
    ChallengeProjectResult,
    ChallengeResource,
    ChallengeResourceRole,
    ChallengeReviewSummation,
    ChallengeSubmission,
    ChallengeSubmissionType,
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
const LEGACY_COPILOT_PAGE_SIZE = 1000
const MAX_LEGACY_COPILOT_PAGES = 20
const SUBMISSION_HISTORY_PAGE_SIZE = 200
const REVIEW_SUMMATIONS_PAGE_SIZE = 500
const PROJECT_RESULTS_PAGE_SIZE = 100
const MAX_DETAIL_PAGES = 100
const PAGE_REQUEST_BATCH_SIZE = 4

const DEFAULT_SUMMARY: OpportunitySummary = {
    competitions: { amount: 0, count: 0 },
    copilots: { amount: 0, count: 0 },
    engagements: { count: 0 },
    reviews: { count: 0 },
}

/**
 * Uploads a member's ZIP directly to the v6 Review API for the active submission phase.
 *
 * @param challengeId Challenge API UUID receiving the submission.
 * @param memberId authenticated submitter's numeric member identifier serialized as text.
 * @param type Review API submission category derived from the active challenge phase.
 * @param file single ZIP archive selected in the Opportunities submission form.
 * @param onProgress optional callback receiving whole-number upload completion from 0 to 100.
 * @param signal optional abort signal used by the form's cancel-file action.
 * @returns the newly created Review API submission.
 * @throws request, authorization, registration, phase, validation, or upload errors from Review API.
 */
export async function createChallengeSubmission(
    challengeId: string,
    memberId: string,
    type: ChallengeSubmissionType,
    file: File,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal,
): Promise<ChallengeSubmission> {
    const formData = new FormData()
    formData.append('challengeId', challengeId)
    formData.append('memberId', memberId)
    formData.append('type', type)
    formData.append('fileName', file.name)
    formData.append('file', file, file.name)

    return xhrPostAsync<FormData, ChallengeSubmission>(
        `${V6_URL}/submissions`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: event => {
                const total = event.total ?? file.size
                if (!onProgress || total <= 0) return
                onProgress(Math.min(100, Math.round((event.loaded / total) * 100)))
            },
            signal,
        },
    )
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
 * Resolves page loaders in small batches while preserving page order.
 *
 * @param pageNumbers ordered page numbers to request.
 * @param loader API-specific page loader.
 * @returns one result per page in the same order.
 * @throws Propagates the first page-loader failure.
 */
async function loadPagesInBatches<T>(
    pageNumbers: number[],
    loader: (page: number) => Promise<T>,
): Promise<T[]> {
    const results: T[] = []
    for (let offset = 0; offset < pageNumbers.length; offset += PAGE_REQUEST_BATCH_SIZE) {
        const batch = pageNumbers.slice(offset, offset + PAGE_REQUEST_BATCH_SIZE)
        // eslint-disable-next-line no-await-in-loop
        results.push(...await Promise.all(batch.map(loader)))
    }

    return results
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

        // Challenge API's query parser only coerces bracketed keys into arrays;
        // even a single facet must be sent as `tracks[]=Dev` / `types[]=MM`.
        appendValues(url, 'tracks[]', filters.tracks)
        appendValues(url, 'types[]', filters.types)
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
        if (filters.role) url.searchParams.set('role', filters.role)
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
        const startingSoon = filters.sort === 'startingSoon'
        url.searchParams.set('sortBy', highestPayment
            ? 'basePayment'
            : startingSoon ? 'startDate' : 'createdAt')
        url.searchParams.set('sortOrder', startingSoon ? 'asc' : 'desc')
        if (filters.search) url.searchParams.set('search', filters.search)
        appendValues(url, 'status', filters.statuses)
        appendValues(url, 'tracks', filters.tracks)
        appendValues(url, 'types', filters.types)
        if (filters.applied) url.searchParams.set('appliedByMe', 'true')
    }

    return url.toString()
}

/**
 * Flattens legacy copilot records whose request fields live under `data` into
 * the list-card model used by Opportunities.
 *
 * @param item raw Projects API copilot opportunity.
 * @returns normalized copilot opportunity with a stable project name.
 * @throws Does not throw; absent legacy data is treated as an empty object.
 */
function normalizeCopilotOpportunity(item: any): CopilotOpportunity {
    const requestData = item?.data && typeof item.data === 'object' ? item.data : {}
    return {
        ...item,
        ...requestData,
        projectName: requestData.projectName ?? item.projectName ?? item.project?.name,
    }
}

/**
 * Identifies the validation response returned by the previously deployed
 * Projects API when it receives the newer discovery filters.
 *
 * @param error rejected Projects API request in either Axios or shared-XHR form.
 * @returns true only for a 400 response that rejects an unknown query property.
 * @throws Does not throw.
 */
function isLegacyCopilotQueryError(error: unknown): boolean {
    const failure = error as {
        data?: { message?: unknown }
        message?: unknown
        response?: { data?: { message?: unknown }; status?: number }
        status?: number
    }
    const status = failure.status ?? failure.response?.status
    const values = [failure.message, failure.data?.message, failure.response?.data?.message]
        .flatMap(value => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string => typeof value === 'string')
    return status === 400 && values.some(value => /property \S+ should not exist/i.test(value))
}

/**
 * Builds the limited list query understood by the legacy Projects API.
 *
 * @param page one-based legacy API page.
 * @returns absolute copilot opportunity URL without unsupported discovery filters.
 * @throws Does not throw.
 */
function buildLegacyCopilotPageUrl(page: number): string {
    const url = new URL(`${V6_URL}/projects/copilots/opportunities`)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(LEGACY_COPILOT_PAGE_SIZE))
    // The pre-discovery deployment rejects startDate; fetch with its supported
    // creation-date sort and apply the selected semantic sort after aggregation.
    url.searchParams.set('sort', 'createdAt desc')
    url.searchParams.set('noGrouping', 'true')
    return url.toString()
}

/**
 * Applies a stable semantic sort after legacy pages have been aggregated.
 *
 * @param items filtered legacy copilot opportunities.
 * @param sort semantic Opportunities sort selection.
 * @returns a new starting-soon array, or the already-newest API ordering.
 * @throws Does not throw.
 */
function sortLegacyCopilotOpportunities(
    items: CopilotOpportunity[],
    sort?: string,
): CopilotOpportunity[] {
    if (sort !== 'startingSoon') return items
    return [...items].sort((first, second) => {
        const firstDate = Date.parse(first.startDate ?? '')
        const secondDate = Date.parse(second.startDate ?? '')
        const firstValue = Number.isFinite(firstDate) ? firstDate : Number.POSITIVE_INFINITY
        const secondValue = Number.isFinite(secondDate) ? secondDate : Number.POSITIVE_INFINITY
        return firstValue - secondValue
            || String(first.id)
                .localeCompare(String(second.id))
    })
}

/**
 * Applies the current discovery controls after fetching legacy copilot rows.
 * This is used only when the deployed Projects API rejects server-side filters.
 *
 * @param items normalized legacy copilot opportunities.
 * @param filters active Opportunities search and facet values.
 * @returns rows matching every active filter.
 * @throws Does not throw.
 */
function filterLegacyCopilotOpportunities(
    items: CopilotOpportunity[],
    filters: OpportunityFilters,
): CopilotOpportunity[] {
    const statuses = new Set((filters.statuses ?? []).map(value => value.toLowerCase()))
    const types = new Set([...(filters.tracks ?? []), ...(filters.types ?? [])]
        .map(value => value.toLowerCase()))
    const skills = (filters.skills ?? []).map(value => value.toLowerCase())
    const search = filters.search?.trim()
        .toLowerCase()

    return items.filter(item => {
        const itemType = String(item.projectType ?? item.type ?? '')
            .toLowerCase()
        const itemSkills = (item.skills ?? []).map(skill => `${skill.id ?? ''} ${skill.name}`.toLowerCase())
        const itemStatus = String(item.status ?? '')
            .toLowerCase()
        if (statuses.size && !statuses.has(itemStatus)) return false
        if (types.size && !types.has(itemType)) return false
        if (skills.length && !skills.some(skill => itemSkills.some(value => value.includes(skill)))) return false
        if (filters.applied && !item.hasApplied && !item.currentUserApplication) return false
        if (!search) return true

        return [
            item.opportunityTitle,
            item.overview,
            item.projectName,
            item.project?.name,
            item.projectType,
            item.type,
            ...itemSkills,
        ].filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search)
    })
}

/**
 * Keeps Copilot Opportunities usable while an older Projects API deployment
 * is rolling forward to the server-side discovery contract.
 *
 * @param filters active discovery, sorting, and pagination values.
 * @returns the requested in-memory page after all legacy pages are normalized and filtered.
 * @throws Propagates Projects API and network errors.
 */
async function getLegacyCopilotPage(filters: OpportunityFilters): Promise<OpportunityPage<CopilotOpportunity>> {
    const firstResponse = await xhrGlobalInstance.get(
        buildLegacyCopilotPageUrl(1),
    ) as AxiosResponse<any[] | ApiEnvelope<any[]> | ApiListResponse<any>>
    const firstPage = normalizePage(firstResponse, 1, LEGACY_COPILOT_PAGE_SIZE)
    const totalPages = Math.min(MAX_LEGACY_COPILOT_PAGES, Math.max(1, firstPage.totalPages))
    const remainingResponses = totalPages > 1
        ? await loadPagesInBatches(
            Array.from({ length: totalPages - 1 }, (_value, index) => index + 2),
            page => xhrGlobalInstance.get(buildLegacyCopilotPageUrl(page)),
        ) as AxiosResponse<any[] | ApiEnvelope<any[]> | ApiListResponse<any>>[]
        : []
    const allItems = [
        ...firstPage.items,
        ...remainingResponses.flatMap((response, index) => normalizePage(
            response,
            index + 2,
            LEGACY_COPILOT_PAGE_SIZE,
        ).items),
    ].map(normalizeCopilotOpportunity)
    const filtered = sortLegacyCopilotOpportunities(
        filterLegacyCopilotOpportunities(allItems, filters),
        filters.sort,
    )
    const page = Math.max(1, filters.page)
    const perPage = Math.max(1, filters.perPage)
    const offset = (page - 1) * perPage
    return {
        items: filtered.slice(offset, offset + perPage),
        page,
        perPage,
        total: filtered.length,
        totalPages: filtered.length ? Math.ceil(filtered.length / perPage) : 0,
    }
}

/**
 * Loads one filtered page from the owning domain API. For “My competitions,”
 * this first resolves the canonical Submitter role and then performs one
 * globally filtered, sorted, and paginated Challenge API request. Copilot
 * validation failures from an older Projects API use the bounded legacy
 * fetch-and-filter fallback until that deployment supports discovery filters.
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

    try {
        const response = await xhrGlobalInstance.get(buildOpportunityPageUrl(kind, filters)) as AxiosResponse<
            any[] | ApiEnvelope<any[]> | ApiListResponse<any>
        >
        const normalized = normalizePage(response, page, perPage)
        return kind === 'copilots'
            ? { ...normalized, items: normalized.items.map(normalizeCopilotOpportunity) }
            : normalized
    } catch (error) {
        if (kind !== 'copilots' || !isLegacyCopilotQueryError(error)) throw error
        return getLegacyCopilotPage(filters)
    }
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

interface ReviewSummationApiResponse {
    data?: ChallengeReviewSummation[]
    meta?: {
        page?: number
        perPage?: number
        total?: number
        totalCount?: number
        totalPages?: number
    }
    result?: {
        content?: ChallengeReviewSummation[]
        metadata?: Record<string, any>
    }
}

interface ProjectResultApiResponse {
    data?: ChallengeProjectResult[]
    meta?: {
        page?: number
        perPage?: number
        total?: number
        totalCount?: number
        totalPages?: number
    }
}

/**
 * Converts supported Review API submission response shapes into the shared page model.
 *
 * @param response bare submissions or an API envelope with pagination metadata.
 * @param page requested page used when metadata is absent.
 * @param perPage requested page size used when metadata is absent.
 * @returns normalized submission items and pagination values.
 * @throws Does not throw.
 */
function normalizeSubmissionPage(
    response: SubmissionApiResponse | ChallengeSubmission[],
    page: number,
    perPage: number,
): OpportunityPage<ChallengeSubmission> {
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
 * Loads one submissions page for a challenge detail tab.
 *
 * @param challengeId challenge UUID.
 * @param page one-based page.
 * @param perPage page size.
 * @param memberId optional member filter for the My Submissions tab.
 * @param latestOnly whether to retain only the newest attempt per member.
 * @returns normalized submissions page.
 * @throws Propagates Review API and network errors.
 */
export async function getChallengeSubmissions(
    challengeId: string,
    page: number,
    perPage: number,
    memberId?: string,
    latestOnly: boolean = true,
): Promise<OpportunityPage<ChallengeSubmission>> {
    const url = new URL(`${V6_URL}/submissions`)
    url.searchParams.set('challengeId', challengeId)
    url.searchParams.set('page', String(page))
    url.searchParams.set('perPage', String(perPage))
    if (latestOnly) url.searchParams.set('isLatest', 'true')
    url.searchParams.set('sortBy', 'submittedDate')
    url.searchParams.set('orderBy', 'desc')
    if (memberId) url.searchParams.set('memberId', memberId)
    const response = await xhrGetAsync<SubmissionApiResponse | ChallengeSubmission[]>(url.toString())
    return normalizeSubmissionPage(response, page, perPage)
}

/**
 * Requests the authorized short-lived URL for a submission download action.
 *
 * @param submissionId Review API submission identifier.
 * @returns signed clean-storage URL.
 * @throws Error when Review API omits the URL; otherwise propagates API errors.
 */
export async function getChallengeSubmissionDownloadUrl(submissionId: string): Promise<string> {
    const response = await xhrGetAsync<{ url?: string }>(
        `${V6_URL}/submissions/${encodeURIComponent(submissionId)}/download-url`,
    )
    if (!response.url) throw new Error('Review API did not return a submission download URL.')
    return response.url
}

/**
 * Deletes one submission through Review API after the caller confirms the
 * authored My Submissions action.
 *
 * @param submissionId Review API submission identifier owned by the caller.
 * @returns void after Review API accepts the deletion.
 * @throws Propagates Review API authorization, lifecycle, and network errors.
 */
export async function deleteChallengeSubmission(submissionId: string): Promise<void> {
    await xhrDeleteAsync<void>(`${V6_URL}/submissions/${encodeURIComponent(submissionId)}`)
}

/**
 * Loads every submission attempt for one challenge member for the History
 * dialog. The latest-only flag is deliberately omitted on this request.
 *
 * @param challengeId challenge UUID.
 * @param memberId submitter member ID from the selected latest submission.
 * @param submissionType optional submission type to prevent checkpoint/final-fix rows mixing.
 * @returns all matching attempts, newest first.
 * @throws Propagates Review API and network errors.
 */
export async function getChallengeSubmissionHistory(
    challengeId: string,
    memberId: string,
    submissionType?: string,
): Promise<ChallengeSubmission[]> {
    /**
     * Builds one non-latest submission-history request.
     *
     * @param page one-based Review API page.
     * @returns absolute submissions URL for the selected member and type.
     */
    const makeUrl = (page: number): string => {
        const url = new URL(`${V6_URL}/submissions`)
        url.searchParams.set('challengeId', challengeId)
        url.searchParams.set('memberId', memberId)
        url.searchParams.set('page', String(page))
        url.searchParams.set('perPage', String(SUBMISSION_HISTORY_PAGE_SIZE))
        url.searchParams.set('sortBy', 'submittedDate')
        url.searchParams.set('orderBy', 'desc')
        if (submissionType) url.searchParams.set('type', submissionType)
        return url.toString()
    }

    const firstResponse = await xhrGetAsync<SubmissionApiResponse | ChallengeSubmission[]>(makeUrl(1))
    const firstPage = normalizeSubmissionPage(firstResponse, 1, SUBMISSION_HISTORY_PAGE_SIZE)
    const totalPages = Math.min(MAX_DETAIL_PAGES, Math.max(1, firstPage.totalPages))
    const additionalPages = totalPages > 1
        ? await loadPagesInBatches(
            Array.from({ length: totalPages - 1 }, (_value, index) => index + 2),
            async page => {
                const response = await xhrGetAsync<SubmissionApiResponse | ChallengeSubmission[]>(makeUrl(page))
                return normalizeSubmissionPage(response, page, SUBMISSION_HISTORY_PAGE_SIZE).items
            },
        )
        : []
    return [...firstPage.items, ...additionalPages.flat()]
        .sort((first, second) => {
            const firstDate = Date.parse(first.submittedDate ?? first.createdAt ?? '')
            const secondDate = Date.parse(second.submittedDate ?? second.createdAt ?? '')
            return (Number.isFinite(secondDate) ? secondDate : 0)
                - (Number.isFinite(firstDate) ? firstDate : 0)
        })
}

/**
 * Loads all Review API aggregate scores needed by Marathon Match submissions
 * and the legacy score-over-time dashboard.
 *
 * @param challengeId Marathon Match challenge UUID.
 * @returns all review summations visible to the authenticated challenge member.
 * @throws Propagates Review API authorization and network errors.
 */
export async function getChallengeReviewSummations(
    challengeId: string,
): Promise<ChallengeReviewSummation[]> {
    /**
     * Builds one paginated review-summation request for the selected challenge.
     *
     * @param page one-based Review API page.
     * @returns absolute review-summations URL.
     */
    const makeUrl = (page: number): string => {
        const url = new URL(`${V6_URL}/reviewSummations`)
        url.searchParams.set('challengeId', challengeId)
        url.searchParams.set('page', String(page))
        url.searchParams.set('perPage', String(REVIEW_SUMMATIONS_PAGE_SIZE))
        return url.toString()
    }

    const firstResponse = await xhrGetAsync<ReviewSummationApiResponse | ChallengeReviewSummation[]>(makeUrl(1))
    if (Array.isArray(firstResponse)) return firstResponse
    const firstItems = firstResponse.data ?? firstResponse.result?.content ?? []
    const metadata = firstResponse.meta ?? firstResponse.result?.metadata ?? {}
    const totalPages = Math.min(MAX_DETAIL_PAGES, Math.max(
        1,
        toNumber(metadata.totalPages, 1),
    ))
    if (totalPages === 1) return firstItems
    const additionalPages = await loadPagesInBatches(
        Array.from({ length: totalPages - 1 }, (_value, index) => index + 2),
        async page => {
            const response = await xhrGetAsync<ReviewSummationApiResponse | ChallengeReviewSummation[]>(
                makeUrl(page),
            )
            if (Array.isArray(response)) return response
            return response.data ?? response.result?.content ?? []
        },
    )
    return [...firstItems, ...additionalPages.flat()]
}

/**
 * Loads every canonical final-placement result exposed by Review API for a
 * challenge. Review API applies the caller's challenge visibility and
 * `read:project-result` authorization before returning scores.
 *
 * @param challengeId challenge UUID whose winner results are required.
 * @returns all authorized project-result rows in API page order.
 * @throws Propagates Review API authorization and network errors.
 */
export async function getChallengeProjectResults(
    challengeId: string,
): Promise<ChallengeProjectResult[]> {
    /**
     * Builds one paginated project-result request for the selected challenge.
     *
     * @param page one-based Review API page.
     * @returns absolute project-result URL.
     */
    const makeUrl = (page: number): string => {
        const url = new URL(`${V6_URL}/projectResult`)
        url.searchParams.set('challengeId', challengeId)
        url.searchParams.set('page', String(page))
        url.searchParams.set('perPage', String(PROJECT_RESULTS_PAGE_SIZE))
        return url.toString()
    }

    const firstResponse = await xhrGetAsync<ProjectResultApiResponse | ChallengeProjectResult[]>(makeUrl(1))
    if (Array.isArray(firstResponse)) return firstResponse
    const firstItems = firstResponse.data ?? []
    const totalPages = Math.min(MAX_DETAIL_PAGES, Math.max(
        1,
        toNumber(firstResponse.meta?.totalPages, 1),
    ))
    if (totalPages === 1) return firstItems
    const additionalPages = await loadPagesInBatches(
        Array.from({ length: totalPages - 1 }, (_value, index) => index + 2),
        async page => {
            const response = await xhrGetAsync<ProjectResultApiResponse | ChallengeProjectResult[]>(
                makeUrl(page),
            )
            return Array.isArray(response) ? response : response.data ?? []
        },
    )
    return [...firstItems, ...additionalPages.flat()]
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
        `${V6_URL}/resource-roles`,
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
 * Removes an authenticated member's Submitter resource using Resource API's
 * body-based delete contract.
 *
 * @param challengeId challenge UUID owning the registration.
 * @param memberHandle authenticated member handle.
 * @returns void after deletion.
 * @throws Propagates role resolution, Resource API authorization, and network errors.
 */
export async function unregisterFromChallenge(
    challengeId: string,
    memberHandle: string,
): Promise<void> {
    const role = await getSubmitterRole()
    await xhrRequestAsync({
        data: {
            challengeId,
            memberHandle,
            roleId: role.id,
        },
        method: 'DELETE',
        url: `${V6_URL}/resources`,
    })
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
