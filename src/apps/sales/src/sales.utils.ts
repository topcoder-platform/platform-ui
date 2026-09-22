import { SalesQuery, SalesReport, SalesSummary, SalesSummaryAmount, SalesSummaryGroup } from './sales.models'

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
 * Merges the stage drilldown into the report query.
 * @param current Active report query.
 * @param column Category column the drilldown targets, such as the Stage column.
 * @param value Exact displayed value to drill into; an empty value clears the drilldown.
 * @returns The current query when nothing changed, otherwise a new query reset to page one. Does not throw.
 */
export function withDrilldown(current: SalesQuery, column: string, value: string): SalesQuery {
    // A column alone never narrows the page, so both halves travel together.
    const applied = !!column && !!value
    const next = {
        drilldownColumn: applied ? column : undefined,
        drilldownValue: applied ? value : undefined,
    }
    if (next.drilldownColumn === current.drilldownColumn && next.drilldownValue === current.drilldownValue) {
        return current
    }

    return { ...current, ...next, page: 1 }
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

/**
 * Columns PM-6392 removes from the executive table. The data stays in Salesforce
 * and in the API response; only this dashboard stops showing it.
 */
const hiddenColumnPatterns: RegExp[] = [
    /^reporting account$/i,
    /^close month$/i,
    /^expected revenue \(converted\)$/i,
    /^amount \(converted\)$/i,
    /^forecast alert$/i,
]

/**
 * The PM-6392 column order. A column the Salesforce report adds later matches no
 * pattern and keeps its report position behind the ordered ones, so new fields
 * appear rather than silently disappearing.
 */
const columnOrderPatterns: RegExp[] = [
    /^stage$/i,
    /^opportunity(\s+name)?$/i,
    /^account name$/i,
    /^subcontracting end customer$/i,
    /^reporting smu$/i,
    /^amount$/i,
    /^expected revenue$/i,
    /^created date$/i,
    /^close date$/i,
    /^opportunity owner$/i,
]

/** A report column together with the cell position it keeps in every row. */
export interface SalesDisplayColumn {
    column: SalesReport['columns'][number]
    /** Position of this column's cell in every row; display order never changes it. */
    index: number
}

/**
 * Chooses and orders the columns the Sales table shows.
 * @param report Loaded report, or undefined before the first response.
 * @returns The visible columns in PM-6392 order, each paired with its original cell
 * index, so callers read `row.cells[index]` rather than re-ordering row data.
 * @throws Does not throw; a report with none of the known columns keeps report order.
 */
export function displayedColumns(report?: SalesReport): SalesDisplayColumn[] {
    return (report?.columns ?? [])
        .map((column, index) => ({ column, index }))
        .filter(entry => !hiddenColumnPatterns.some(pattern => pattern.test(entry.column.label.trim())))
        .map(entry => {
            const rank = columnOrderPatterns.findIndex(pattern => pattern.test(entry.column.label.trim()))
            return { ...entry, rank: rank < 0 ? columnOrderPatterns.length : rank }
        })
        .sort((left, right) => left.rank - right.rank || left.index - right.index)
        .map(entry => ({ column: entry.column, index: entry.index }))
}

/**
 * Matches the Amount column the summary cards and stage tiles total. The optional
 * suffix keeps the card working when the report provides only the converted total,
 * which `displayedAmounts` prefers because it states one currency.
 */
const amountLabelPattern = /^amount(\s*\(converted\))?$/i
/** Matches the Expected Revenue column the summary cards and stage tiles total. */
const expectedRevenueLabelPattern = /^expected\s*revenue(\s*\(converted\))?$/i
/** Matches the stage column among the report's category breakdowns. */
const stageLabelPattern = /stage/i
/** Matches the stage whose signed value the WON SOW Signed card reports. */
const wonSowSignedPattern = /won.*sow.*signed/i

/**
 * The PM-6392 stage order. Stages the pipeline adds later match no pattern and
 * follow the known ones, ordered by value as the API returned them.
 */
const stageOrderPatterns: RegExp[] = [
    /^prospect/i,
    /^qualification/i,
    /^proposal/i,
    /^contract/i,
    /^closing/i,
    wonSowSignedPattern,
]

/**
 * Picks one named total out of a set of amounts, ignoring converted duplicates.
 * @param amounts Summary or bucket totals, in report order.
 * @param pattern Label pattern identifying the wanted column.
 * @returns The matching total, or undefined when the report has no such column.
 * @throws Does not throw.
 */
function namedAmount(amounts: SalesSummaryAmount[], pattern: RegExp): SalesSummaryAmount | undefined {
    return displayedAmounts(amounts)
        .find(amount => pattern.test(amount.label.trim()))
}

/**
 * Reads the Amount total behind the Total Amount card and the stage tiles.
 * @param amounts Summary or bucket totals, in report order.
 * @returns The Amount total, falling back to the report's first non-converted total
 * so a renamed column still produces a card; undefined when the report has no amounts.
 * @throws Does not throw.
 */
export function amountTotal(amounts: SalesSummaryAmount[]): SalesSummaryAmount | undefined {
    return namedAmount(amounts, amountLabelPattern) ?? displayedAmounts(amounts)[0]
}

/**
 * Reads the Expected Revenue total behind its card and the stage tiles.
 * @param amounts Summary or bucket totals, in report order.
 * @returns The Expected Revenue total, or undefined when the report does not provide one.
 * @throws Does not throw.
 */
export function expectedRevenueTotal(amounts: SalesSummaryAmount[]): SalesSummaryAmount | undefined {
    return namedAmount(amounts, expectedRevenueLabelPattern)
}

/** One clickable stage tile: its opportunity count beside its two headline totals. */
export interface SalesStageTile {
    label: string
    count: number
    amount?: SalesSummaryAmount
    expectedRevenue?: SalesSummaryAmount
}

/** The stage breakdown the dashboard renders and filters the table from. */
export interface SalesStageBreakdown {
    /** Column ID a tile click drills the table into. */
    columnId: string
    label: string
    stages: SalesStageTile[]
    /** Stages the API capped out of the response, reported rather than hidden. */
    otherStages: number
}

/**
 * Builds the compact stage breakdown from the snapshot-wide summary.
 * @param summary Aggregates over every matching row, or undefined when the report has none.
 * @returns The stage group in PM-6392 order with an Amount and an Expected Revenue total per
 * stage, or undefined when the report provides no category breakdown to show.
 * @throws Does not throw; a report whose groups do not include a stage falls back to its
 * first category column so the panel still describes the pipeline it does have.
 */
export function stageBreakdown(summary?: SalesSummary): SalesStageBreakdown | undefined {
    const group: SalesSummaryGroup | undefined = summary?.groups
        .find(candidate => stageLabelPattern.test(candidate.label) || stageLabelPattern.test(candidate.columnId))
        ?? summary?.groups[0]
    if (!group) return undefined

    const stages = group.buckets
        .map((bucket, index) => {
            const rank = stageOrderPatterns.findIndex(pattern => pattern.test(bucket.label.trim()))
            return { bucket, index, rank: rank < 0 ? stageOrderPatterns.length : rank }
        })
        .sort((left, right) => left.rank - right.rank || left.index - right.index)
        .map(entry => ({
            // A response without per-bucket amounts still shows the primary total.
            amount: entry.bucket.amounts
                ? amountTotal(entry.bucket.amounts)
                : {
                    columnId: group.amountColumnId ?? group.columnId,
                    count: entry.bucket.count,
                    currencyCode: group.currencyCode,
                    label: group.label,
                    mixedCurrency: group.mixedCurrency,
                    total: entry.bucket.total,
                },
            count: entry.bucket.count,
            expectedRevenue: entry.bucket.amounts ? expectedRevenueTotal(entry.bucket.amounts) : undefined,
            label: entry.bucket.label,
        }))
    return { columnId: group.columnId, label: group.label, otherStages: group.otherBuckets, stages }
}

/**
 * Reads the signed value behind the Total WON SOW Signed card.
 * @param breakdown Stage breakdown for the current filters, or undefined.
 * @returns The Amount total of the Won - SOW Signed stage, or undefined when the
 * filtered pipeline contains no such stage.
 * @throws Does not throw.
 */
export function wonSowSignedTotal(breakdown?: SalesStageBreakdown): SalesSummaryAmount | undefined {
    return breakdown?.stages.find(stage => wonSowSignedPattern.test(stage.label.trim()))?.amount
}
