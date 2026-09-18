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
 * Currency shown for a single-currency total the report leaves uncoded. The converted
 * columns arrive coded in US dollars while Amount and Expected Revenue arrive uncoded,
 * so this keeps every tile reading the same way.
 */
const defaultCurrencyCode = 'USD'

/** Column ID and label suffixes Salesforce gives a currency column converted to the corporate currency. */
const convertedIdPattern = /_CONVERTED$/i
const convertedLabelPattern = /\s*\(converted\)$/i

/**
 * Drops each total whose converted counterpart the report also provides, such as Amount beside
 * Amount (converted), because the converted total already states the figure in one currency.
 * @param amounts Summary totals in report order.
 * @returns The totals to show, in the same order; all of them when none has a converted counterpart.
 * @throws Does not throw.
 */
export function displayedAmounts(amounts: SalesSummaryAmount[]): SalesSummaryAmount[] {
    const converted = new Set<string>()
    amounts.forEach(amount => {
        if (convertedIdPattern.test(amount.columnId)) {
            converted.add(amount.columnId.replace(convertedIdPattern, '')
                .toLowerCase())
        }

        if (convertedLabelPattern.test(amount.label)) {
            converted.add(amount.label.replace(convertedLabelPattern, '')
                .toLowerCase())
        }
    })
    return amounts.filter(amount => !converted.has(amount.columnId.toLowerCase())
        && !converted.has(amount.label.toLowerCase()))
}

/**
 * Formats a snapshot-wide total for display, using the currency the matching rows agree on.
 * @param amount Summary entry for one numeric column.
 * @returns A localized currency amount, in the shared currency or in US dollars when the
 * report leaves a single-currency total uncoded; a plain number when the rows mix currencies.
 * @throws Does not throw for an unexpected currency code; falls back to a plain number.
 */
export function formatSummaryAmount(amount: SalesSummaryAmount): string {
    const currency = amount.currencyCode ?? (amount.mixedCurrency ? undefined : defaultCurrencyCode)
    try {
        return amount.total.toLocaleString(undefined, currency
            ? { currency, maximumFractionDigits: 0, style: 'currency' }
            : { maximumFractionDigits: 0 })
    } catch {
        return amount.total.toLocaleString(undefined, { maximumFractionDigits: 0 })
    }
}
