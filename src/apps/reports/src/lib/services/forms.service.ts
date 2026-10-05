import { EnvironmentConfig } from '~/config'
import { xhrCreateInstance, xhrGetAsync } from '~/libs/core'

export interface ReportForm {
    key: string
    title: string
}

export interface FormDates {
    startDate?: string
    endDate?: string
}

export interface FormReport {
    form: string
    columns: string[]
    labels: Record<string, string>
    data: Record<string, unknown>[]
    total: number
    nextCursor: string | null
}

interface FormsDirectoryPage {
    data: ReportForm[]
    nextCursor: string | null
}

const client = xhrCreateInstance()
const base = `${EnvironmentConfig.API.V6}/forms`

/**
 * Encodes shared inclusive UTC date filters for table and CSV requests.
 * @param dates Optional calendar date bounds. @returns URL query parameters.
 * @throws Does not throw.
 */
export function formDateParams(dates: FormDates): URLSearchParams {
    const params = new URLSearchParams()
    if (dates.startDate) params.set('startDate', dates.startDate)
    if (dates.endDate) params.set('endDate', dates.endDate)
    return params
}

/**
 * Loads all reportable form names using the reporting-only directory endpoint.
 * @returns Forms available in the selector, including retired revisions.
 * @throws Propagates authenticated API errors; rejects repeated server cursors.
 */
export async function fetchReportForms(): Promise<ReportForm[]> {
    const forms: ReportForm[] = []
    const seen = new Set<string>()
    let after: string | null | undefined
    do {
        const suffix = after ? `?after=${encodeURIComponent(after)}` : ''
        // Each request needs the cursor returned by the previous page.
        // eslint-disable-next-line no-await-in-loop
        const page = await xhrGetAsync<FormsDirectoryPage>(`${base}/reports/directory${suffix}`, client)
        forms.push(...page.data)
        after = page.nextCursor
        if (after && seen.has(after)) throw new Error('Invalid forms directory cursor')
        if (after) seen.add(after)
    } while (after)

    return forms
}

/**
 * Fetches one 25-row submission page across every published revision.
 * @param key Selected form key. @param dates Inclusive UTC dates. @param after Previous page cursor.
 * @returns Columns, rows, total, and continuation cursor. @throws Propagates authenticated API/validation errors.
 */
export function fetchFormSubmissions(key: string, dates: FormDates, after?: string): Promise<FormReport> {
    const params = formDateParams(dates)
    params.set('limit', '25')
    if (after) params.set('after', after)
    return xhrGetAsync(`${base}/${encodeURIComponent(key)}/submissions?${params}`, client)
}

/**
 * Downloads all matching submissions, independently of table pagination.
 * @param key Selected form key. @param dates Inclusive UTC bounds; omit to export all submissions.
 * @returns Spreadsheet-safe CSV blob. @throws Propagates authenticated API/network errors.
 */
export async function downloadFormSubmissions(key: string, dates: FormDates = {}): Promise<Blob> {
    const response = await client.get<Blob>(
        `${base}/${encodeURIComponent(key)}/submissions/export?${formDateParams(dates)}`,
        { headers: { Accept: 'text/csv' }, responseType: 'blob' },
    )
    return response.data
}

/**
 * Formats a typed submission cell without dropping false, zero, or multi-select answers.
 * @param value API report value. @returns Plain text for a React table cell; never HTML.
 * @throws Does not throw for API JSON values.
 */
export function formatFormValue(value: unknown): string {
    if (value === null || value === undefined) return '—'
    return Array.isArray(value) ? value.join(', ') : String(value)
}
