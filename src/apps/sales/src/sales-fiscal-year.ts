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
