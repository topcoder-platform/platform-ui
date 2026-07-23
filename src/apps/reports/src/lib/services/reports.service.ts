import type { AxiosInstance } from 'axios'

import { EnvironmentConfig } from '~/config'
import { xhrCreateInstance, xhrGetAsync } from '~/libs/core/lib/xhr'

import { dashboardRouteSlugs } from '../../config/routes.config'

export type ReportParameter = {
    name: string
    type: 'string' | 'string[]' | 'number' | 'number[]' | 'boolean' | 'date' | 'enum' | 'enum[]'
    description?: string
    required?: boolean
    location?: 'query' | 'path'
    options?: string[]
}

export type ReportDefinition = {
    name: string
    path: string
    description?: string
    method: string
    parameters?: ReportParameter[]
}

export type ReportGroup = {
    label: string
    basePath: string
    reports: ReportDefinition[]
}

export type ReportsIndexResponse = Record<string, ReportGroup>

export type DashboardSlug = typeof dashboardRouteSlugs[keyof typeof dashboardRouteSlugs]

/**
 * Optional UTC date boundaries accepted by dashboard endpoints.
 *
 * `endDate` is exclusive. Both values use `YYYY-MM-DD`.
 */
export interface DashboardQuery {
    endDate?: string
    startDate?: string
}

/**
 * UTC date range returned with dashboard data.
 *
 * `endDate` is exclusive. The API returns both values as ISO-8601 timestamps.
 */
export interface DashboardRange {
    endDate: string
    startDate: string
}

export interface NewSignupsMonth {
    activated: number
    month: string
    notActivated: number
}

export interface NewSignupsSummary {
    activatedMembers: number
    activationRate: number
    notActivatedMembers: number
    peakMonth: string | null
    peakMonthSignups: number
    totalSignups: number
}

export interface NewSignupsDashboard extends DashboardRange {
    dashboard: 'new-signups'
    months: NewSignupsMonth[]
    summary: NewSignupsSummary
}

export interface MembersPaidMonth {
    challenge: number
    engagement: number
    month: string
    taas: number
    task: number
}

export interface MembersPaidSummary {
    challengeUniqueMembers: number
    engagementUniqueMembers: number
    peakMonth: string | null
    peakMonthUniqueMembers: number
    taasUniqueMembers: number
    taskUniqueMembers: number
    totalUniqueMembers: number
}

export interface MembersPaidDashboard extends DashboardRange {
    dashboard: 'members-paid'
    months: MembersPaidMonth[]
    summary: MembersPaidSummary
}

export interface ChallengeParticipationMonth {
    month: string
    registrants: number
    submitters: number
}

export interface ChallengeParticipationSummary {
    peakMonth: string | null
    peakMonthRegistrants: number
    submissionRate: number
    totalUniqueRegistrants: number
    totalUniqueSubmitters: number
}

export interface ChallengeParticipationDashboard extends DashboardRange {
    dashboard: 'challenge-participation'
    months: ChallengeParticipationMonth[]
    summary: ChallengeParticipationSummary
}

export interface DashboardsResponse {
    challengeParticipation: ChallengeParticipationDashboard
    membersPaid: MembersPaidDashboard
    newSignups: NewSignupsDashboard
}

export interface DashboardResponseBySlug {
    'challenge-participation': ChallengeParticipationDashboard
    'members-paid': MembersPaidDashboard
    'new-signups': NewSignupsDashboard
}

export type BillingAccountDetail = {
    name: string
    description: string | null
    subcontractingEndCustomer: string | null
    status: string
    startDate: string | null
    endDate: string | null
    budget: string | number
    markup: string | number
}

export type SfdcBillingAccountPaymentRow = {
    paymentId: string
    paymentDate: string
    billingAccountId: string
    paymentStatus: string
    challengeFee: string | number
    paymentAmount: string | number
    challengeId: string
    category: string
    isTask: boolean
    challengeName: string | null
    challengeStatus: string | null
    winnerHandle: string
    winnerId: string
    winnerFirstName: string
    winnerLastName: string
}

/** Response from GET /sfdc/billing-accounts */
export type BillingAccountProfileResponse = {
    billingAccount?: BillingAccountDetail
}

/** Billing Accounts in-app view: profile + rows from GET /sfdc/payments */
export type BillingAccountsViewData = {
    billingAccount?: BillingAccountDetail
    payments: SfdcBillingAccountPaymentRow[]
}

export type OpenToWorkTalentAvailability = 'FULL_TIME' | 'PART_TIME'

export type OpenToWorkTalentQuery = {
    role?: string
    availability?: OpenToWorkTalentAvailability
    page?: number
    perPage?: number
}

export type OpenToWorkTalentRoleCount = {
    role: string
    count: number
}

export type OpenToWorkTalentMember = {
    userId: string
    handle: string
    firstName: string | null
    lastName: string | null
    country: string | null
    availability: string | null
    preferredRoles: string[]
    memberSince: string | null
    maxRating: number | null
    challengeWins: number
    taskWins: number
    totalWins: number
}

export type OpenToWorkTalentResponse = {
    totalMembers: number
    total: number
    page: number
    perPage: number
    roleCounts: OpenToWorkTalentRoleCount[]
    data: OpenToWorkTalentMember[]
}

const reportsDownloadClient: AxiosInstance = xhrCreateInstance()

const buildReportUrl = (path: string): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${EnvironmentConfig.API.V6}/reports${normalizedPath}`
}

/**
 * Builds a reports API path with Talent query parameters.
 * @param basePath Reports API path relative to `/reports`.
 * @param query Optional role, availability, and pagination values.
 * @returns Path and query string suitable for reports API calls.
 */
export const buildOpenToWorkTalentPath = (
    basePath: string,
    query: OpenToWorkTalentQuery = {},
): string => {
    const params = new URLSearchParams()

    if (query.role) {
        params.append('role', query.role)
    }

    if (query.availability) {
        params.append('availability', query.availability)
    }

    if (query.page) {
        params.append('page', String(query.page))
    }

    if (query.perPage) {
        params.append('perPage', String(query.perPage))
    }

    const queryString = params.toString()
    return queryString ? `${basePath}?${queryString}` : basePath
}

/**
 * Builds a reports-api dashboard path for aggregate/detail JSON and CSV requests.
 *
 * The Reports pages use this helper as the shared cache/download key so the
 * selected dashboard and UTC reporting range cannot diverge between formats.
 *
 * @param query Optional inclusive start and exclusive end dates in `YYYY-MM-DD`.
 * @param slug Optional dashboard detail slug. Omit it for aggregate endpoints.
 * @param exportCsv Whether to target the matching `/export` endpoint.
 * @returns A path relative to `/reports`, including encoded query parameters.
 * @throws Does not throw.
 */
export const buildDashboardPath = (
    query?: DashboardQuery,
    slug?: DashboardSlug,
    exportCsv: boolean = false,
): string => {
    const params = new URLSearchParams()
    const startDate = query?.startDate?.trim()
    const endDate = query?.endDate?.trim()

    if (startDate) {
        params.append('startDate', startDate)
    }

    if (endDate) {
        params.append('endDate', endDate)
    }

    const pathSegments: string[] = [
        '/dashboard',
        ...(slug ? [encodeURIComponent(slug)] : []),
        ...(exportCsv ? ['export'] : []),
    ]
    const path = pathSegments.join('/')
    const queryString = params.toString()

    return queryString ? `${path}?${queryString}` : path
}

export const fetchReportsIndex = async (): Promise<ReportsIndexResponse> => (
    xhrGetAsync<ReportsIndexResponse>(`${EnvironmentConfig.API.V6}/reports/directory`)
)

const downloadReportBlob = async (path: string, accept: string): Promise<Blob> => {
    if (!path) {
        throw new Error('Report path is required')
    }

    const url = buildReportUrl(path)
    const response = await reportsDownloadClient.get<Blob>(url, {
        headers: {
            Accept: accept,
        },
        responseType: 'blob',
    })

    return response.data
}

const postReportBlob = async (
    path: string,
    data: Record<string, unknown> | FormData,
    accept: string,
    contentType: string,
): Promise<Blob> => {
    if (!path) {
        throw new Error('Report path is required')
    }

    const url = buildReportUrl(path)
    const response = await reportsDownloadClient.post<Blob>(url, data, {
        headers: {
            Accept: accept,
            'Content-Type': contentType,
        },
        responseType: 'blob',
    })

    return response.data
}

/**
 * Posts JSON payload to a report endpoint and returns the response body as a blob.
 * @param path Report path relative to `/reports`.
 * @param body Request payload, typically `{ handles: string[] }` for identity lookup endpoints.
 * @returns Blob response body.
 * @throws Error when report path is empty.
 */
export const postReportAsJson = (
    path: string,
    body: Record<string, unknown>,
): Promise<Blob> => (
    postReportBlob(path, body, 'application/json', 'application/json')
)

/**
 * Posts JSON payload to a report endpoint and requests CSV output.
 * @param path Report path relative to `/reports`.
 * @param body Request payload, typically `{ handles: string[] }` for identity lookup endpoints.
 * @returns Blob response body encoded as CSV.
 * @throws Error when report path is empty.
 */
export const postReportAsCsv = (
    path: string,
    body: Record<string, unknown>,
): Promise<Blob> => (
    postReportBlob(path, body, 'text/csv', 'application/json')
)

const createFileFormData = (file: File): FormData => {
    const formData = new FormData()
    formData.append('file', file)
    return formData
}

/**
 * Posts a text/csv file to a report endpoint and requests JSON output.
 * @param path Report path relative to `/reports`.
 * @param file Input file uploaded by the user.
 * @returns Blob response body.
 * @throws Error when report path is empty.
 */
export const postReportFileAsJson = (path: string, file: File): Promise<Blob> => (
    postReportBlob(path, createFileFormData(file), 'application/json', 'multipart/form-data')
)

/**
 * Posts a text/csv file to a report endpoint and requests CSV output.
 * @param path Report path relative to `/reports`.
 * @param file Input file uploaded by the user.
 * @returns Blob response body encoded as CSV.
 * @throws Error when report path is empty.
 */
export const postReportFileAsCsv = (path: string, file: File): Promise<Blob> => (
    postReportBlob(path, createFileFormData(file), 'text/csv', 'multipart/form-data')
)

export const downloadReportAsJson = (path: string): Promise<Blob> => (
    downloadReportBlob(path, 'application/json')
)

export const fetchReportJson = async <T>(path: string): Promise<T> => {
    if (!path) {
        throw new Error('Report path is required')
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const url = `${EnvironmentConfig.API.V6}/reports${normalizedPath}`
    return xhrGetAsync<T>(url, reportsDownloadClient)
}

export const downloadReportAsCsv = (path: string): Promise<Blob> => (
    downloadReportBlob(path, 'text/csv')
)

/**
 * Fetches all dashboard cards for the requested six-month UTC range.
 *
 * @param query Optional inclusive start and exclusive end date filters.
 * @returns Aggregate dashboard data used by the Dashboards landing page.
 * @throws Propagates authenticated reports-api request failures.
 */
export const fetchDashboards = (
    query: DashboardQuery = {},
): Promise<DashboardsResponse> => (
    fetchReportJson<DashboardsResponse>(buildDashboardPath(query))
)

/**
 * Fetches one dashboard drill-down for the requested six-month UTC range.
 *
 * The generic slug maps the result to its exact dashboard response type.
 *
 * @param slug Dashboard route slug selected by the detail page.
 * @param query Optional inclusive start and exclusive end date filters.
 * @returns Typed detail dashboard data for the selected slug.
 * @throws Propagates authenticated reports-api request failures.
 */
export function fetchDashboard<TSlug extends DashboardSlug>(
    slug: TSlug,
    query: DashboardQuery = {},
): Promise<DashboardResponseBySlug[TSlug]> {
    return fetchReportJson<DashboardResponseBySlug[TSlug]>(buildDashboardPath(query, slug))
}

/**
 * Downloads a CSV containing all dashboards for the requested UTC range.
 *
 * @param query Optional inclusive start and exclusive end date filters.
 * @returns CSV response as a browser-downloadable blob.
 * @throws Propagates authenticated reports-api request failures.
 */
export const downloadDashboardsCsv = (
    query: DashboardQuery = {},
): Promise<Blob> => (
    downloadReportAsCsv(buildDashboardPath(query, undefined, true))
)

/**
 * Downloads the selected dashboard's CSV for the requested UTC range.
 *
 * @param slug Dashboard route slug selected by the detail page.
 * @param query Optional inclusive start and exclusive end date filters.
 * @returns CSV response as a browser-downloadable blob.
 * @throws Propagates authenticated reports-api request failures.
 */
export const downloadDashboardCsv = (
    slug: DashboardSlug,
    query: DashboardQuery = {},
): Promise<Blob> => (
    downloadReportAsCsv(buildDashboardPath(query, slug, true))
)

/**
 * Fetches the Talent tab dashboard and paginated member list.
 * @param query Optional role, availability, and pagination values.
 * @returns Open-to-work Talent report data.
 */
export const fetchOpenToWorkTalent = (
    query: OpenToWorkTalentQuery,
): Promise<OpenToWorkTalentResponse> => (
    fetchReportJson<OpenToWorkTalentResponse>(
        buildOpenToWorkTalentPath('/member/open-to-work', query),
    )
)

/**
 * Downloads the Talent tab CSV export for the selected filters.
 * @param query Optional role and availability filters.
 * @returns Blob response encoded as CSV.
 */
export const downloadOpenToWorkTalentCsv = (
    query: OpenToWorkTalentQuery,
): Promise<Blob> => (
    downloadReportAsCsv(buildOpenToWorkTalentPath('/member/open-to-work/export', query))
)

/**
 * Triggers a browser download for a report blob.
 * @param blob the report data returned from the reports API.
 * @param fileName the file name to present in the browser download prompt.
 * @returns nothing. The helper is used by the reports pages after a blob response is received.
 * @throws Does not throw intentionally. Browser download failures surface from the underlying DOM APIs.
 */
export const downloadBlobFile = (blob: Blob, fileName: string): void => {
    const link = document.createElement('a')
    const url = window.URL.createObjectURL(blob)

    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
}
