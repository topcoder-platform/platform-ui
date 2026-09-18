import { SalesQuery, SalesReport, SalesSummaryAmount } from './sales.models'

/** Report column types a date range can be applied to; mirrors the Reports API contract. */
const dateTypes = ['date', 'datetime']

/** Matches the Created Date column so the portal opens on pipeline generation. */
const createdDatePattern = /creat/i

export type SalesDateColumn = SalesReport['columns'][number]

/**
 * Lists the report columns a date range can filter on, such as Created Date and Close Date.
 * @param report Loaded report, or undefined before the first response.
 * @returns Date and datetime columns in report order; empty when the report has none.
 * @throws Does not throw.
 */
export function dateColumns(report?: SalesReport): SalesDateColumn[] {
    return (report?.columns ?? []).filter(column => dateTypes.includes(column.dataType))
}

/**
 * Chooses the date column the portal starts on, preferring Created Date for pipeline analysis.
 * @param columns Available date columns, in report order.
 * @returns The preferred column ID, or an empty string when the report has no date column.
 * @throws Does not throw.
 */
export function defaultDateColumn(columns: SalesDateColumn[]): string {
    const created = columns.find(column => createdDatePattern.test(column.label))
    return (created ?? columns[0])?.id ?? ''
}

/**
 * Explains why a chosen range cannot be applied, so the request is never sent.
 * @param column Selected date column ID.
 * @param from Inclusive lower bound, as a YYYY-MM-DD value from a date input.
 * @param to Inclusive upper bound, as a YYYY-MM-DD value from a date input.
 * @returns A message to display, or an empty string when the range is usable.
 * @throws Does not throw.
 */
export function dateRangeError(column: string, from: string, to: string): string {
    if (!column && (from || to)) return 'Choose the date field this range applies to.'
    if (from && to && from > to) return 'The From date must be on or before the To date.'
    return ''
}

/**
 * Merges the date range controls into the report query.
 * @param current Active report query.
 * @param column Selected date column ID.
 * @param from Inclusive lower bound.
 * @param to Inclusive upper bound.
 * @returns The current query when nothing changed, otherwise a new query reset to page one. Does not throw.
 */
export function withDateRange(current: SalesQuery, column: string, from: string, to: string): SalesQuery {
    // The column alone never filters, so it is only sent once a bound is set.
    const ranged = !!column && !!(from || to)
    const next = {
        dateColumn: ranged ? column : undefined,
        dateFrom: ranged && from ? from : undefined,
        dateTo: ranged && to ? to : undefined,
    }
    if (
        next.dateColumn === current.dateColumn
        && next.dateFrom === current.dateFrom
        && next.dateTo === current.dateTo
    ) {
        return current
    }

    return { ...current, ...next, page: 1 }
}

/**
 * Formats a snapshot-wide total for display, using the currency the matching rows agree on.
 * @param amount Summary entry for one numeric column.
 * @returns A localized currency amount, or a plain number when the rows mix currencies.
 * @throws Does not throw for an unexpected currency code; falls back to a plain number.
 */
export function formatSummaryAmount(amount: SalesSummaryAmount): string {
    try {
        return amount.total.toLocaleString(undefined, amount.currencyCode
            ? { currency: amount.currencyCode, maximumFractionDigits: 0, style: 'currency' }
            : { maximumFractionDigits: 0 })
    } catch {
        return amount.total.toLocaleString(undefined, { maximumFractionDigits: 0 })
    }
}
