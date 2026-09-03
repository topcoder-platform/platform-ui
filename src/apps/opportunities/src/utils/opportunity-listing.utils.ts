import { OpportunityItem } from '../models'

/** A semantic sort value and the label authored in the Opportunities toolbar. */
export interface OpportunitySortOption {
    label: string
    value: string
}

/**
 * Returns the semantic default shared by all opportunity lists.
 *
 * @returns `newest`, which each owning API adapter maps to creation-order descending.
 * @throws Does not throw.
 */
export function defaultSort(): string {
    return 'newest'
}

/**
 * Builds the authored toolbar options shared by every opportunity domain.
 *
 * @returns the product-authored common sort options.
 * @throws Does not throw.
 */
export function opportunitySortOptions(): OpportunitySortOption[] {
    return [
        { label: 'Newest first', value: 'newest' },
        { label: 'Prize high to low', value: 'prizeHighToLow' },
        { label: 'Prize low to high', value: 'prizeLowToHigh' },
        { label: 'Title A-Z', value: 'titleAZ' },
    ]
}

/**
 * Reads the comparable displayed prize/payment from an owner-specific item.
 *
 * @param item challenge, engagement, copilot, or review opportunity.
 * @returns finite numeric value; opportunities without numeric compensation sort last.
 * @throws Does not throw; malformed strings and missing amounts return negative infinity.
 */
function opportunityPrizeValue(item: OpportunityItem): number {
    const value = item as OpportunityItem & Record<string, any>
    const placementTotal = (value.prizeSets ?? [])
        .filter((prizeSet: { type?: string }) => prizeSet.type?.toUpperCase() === 'PLACEMENT')
        .flatMap((prizeSet: { prizes?: Array<{ value?: number }> }) => prizeSet.prizes ?? [])
        .reduce((total: number, prize: { value?: number }) => total + (Number(prize.value) || 0), 0)
    const paymentValues = (value.payments ?? [])
        .map((payment: { payment?: number }) => Number(payment.payment))
        .filter(Number.isFinite)
    const compensationValues = String(value.compensationRange ?? value.otherPaymentType ?? '')
        .match(/[\d,.]+/g)
        ?.map((part: string) => Number(part.replace(/,/g, '')))
        .filter(Number.isFinite) ?? []
    const candidates = [
        Number(value.overview?.totalPrizes),
        placementTotal || Number.NaN,
        Number(value.basePayment),
        ...paymentValues,
        ...compensationValues,
    ].filter(Number.isFinite)
    return candidates.length ? Math.max(...candidates) : Number.NEGATIVE_INFINITY
}

/**
 * Reads the authored display title shared by owner-specific opportunity rows.
 *
 * @param item challenge, engagement, copilot, or review opportunity.
 * @returns normalized title used by the A-Z comparator.
 * @throws Does not throw.
 */
function opportunityTitle(item: OpportunityItem): string {
    const value = item as OpportunityItem & Record<string, any>
    return String(value.name ?? value.title ?? value.opportunityTitle ?? value.challengeName ?? '')
}

/**
 * Compares two owner-specific opportunities using the shared semantic sort.
 *
 * API adapters provide server ordering where supported; this comparator keeps
 * the visible page deterministic for owners whose APIs lack a matching field.
 *
 * @param first first opportunity.
 * @param second second opportunity.
 * @param sort selected shared semantic sort.
 * @returns standard Array.sort comparison value.
 * @throws Does not throw.
 */
export function compareOpportunityItems(
    first: OpportunityItem,
    second: OpportunityItem,
    sort: string,
): number {
    if (sort === 'titleAZ') {
        return opportunityTitle(first)
            .localeCompare(opportunityTitle(second), undefined, { sensitivity: 'base' })
            || String(first.id)
                .localeCompare(String(second.id))
    }

    if (sort === 'prizeHighToLow' || sort === 'prizeLowToHigh') {
        const difference = opportunityPrizeValue(first) - opportunityPrizeValue(second)

        if (difference !== 0 && !Number.isNaN(difference)) {
            return sort === 'prizeLowToHigh' ? difference : -difference
        }
    }

    return 0
}

/**
 * Applies the shared product sort without mutating an owning API response.
 *
 * @param items current normalized owner page.
 * @param sort selected shared semantic sort.
 * @returns copied, deterministically sorted items.
 * @throws Does not throw.
 */
export function sortOpportunityItems<T extends OpportunityItem>(items: T[], sort: string): T[] {
    return [...items].sort((first, second) => compareOpportunityItems(first, second, sort))
}

/**
 * Keeps a selected sort valid when another filter changes its available choices.
 *
 * @param value currently selected sort value.
 * @returns the current value when still supported, otherwise the default sort.
 * @throws Does not throw.
 */
export function normalizeOpportunitySort(value: string): string {
    return opportunitySortOptions()
        .some(option => option.value === value)
        ? value
        : defaultSort()
}
