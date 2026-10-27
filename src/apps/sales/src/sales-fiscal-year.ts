/**
 * Resolves the ending year of Sales' April–March fiscal year in UTC.
 * @param date Date within the fiscal year; defaults to today.
 * @returns Ending calendar year, used by request bounds and report titles. Does not throw for valid dates.
 */
export function salesFiscalYear(date: Date = new Date()): number {
    return date.getUTCFullYear() + (date.getUTCMonth() >= 3 ? 1 : 0)
}

/**
 * Labels the fiscal year or years being viewed without hardcoding the current year.
 * @param from Inclusive ISO start date, if the view has one.
 * @param to Inclusive ISO end date, if the view has one.
 * @returns A short FY label; a single bound selects its year and no bounds select today's year.
 * @throws Does not throw for valid report dates.
 */
export function salesFiscalYearLabel(from?: string, to?: string): string {
    const bound = from || to
    const first = salesFiscalYear(bound ? new Date(bound) : undefined)
    const last = to ? salesFiscalYear(new Date(to)) : first
    const start = String(first)
        .slice(-2)
    const end = String(last)
        .slice(-2)
    return first === last ? `FY '${start}` : `FY '${start}–'${end}`
}

/**
 * Displays the full April–March period named by the report title.
 * @param from Inclusive ISO start date, or undefined for the current fiscal year.
 * @param to Inclusive ISO end date; a range can span multiple fiscal years.
 * @returns Human-readable financial-year bounds. Does not throw for valid report dates.
 */
export function salesFiscalYearPeriod(from?: string, to?: string): string {
    const bound = from || to
    const first = salesFiscalYear(bound ? new Date(bound) : undefined)
    const last = to ? salesFiscalYear(new Date(to)) : first
    return `01 April ${first - 1} - 31 March ${last}`
}
