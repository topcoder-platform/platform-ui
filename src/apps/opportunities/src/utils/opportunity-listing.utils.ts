import { OpportunityKind } from '../models'

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
 * Builds the authored toolbar options for one opportunity domain.
 *
 * @param kind active opportunity domain.
 * @param status active owner status, used to remove time-forward sorting from completed engagements.
 * @returns valid sort options plus the review-only highest-payment choice.
 * @throws Does not throw.
 */
export function opportunitySortOptions(kind: OpportunityKind, status?: string): OpportunitySortOption[] {
    const statusKey = String(status ?? '')
        .trim()
        .toLowerCase()
    const completedEngagement = kind === 'engagements'
        && (statusKey === 'closed' || statusKey === 'completed')
    return [
        { label: 'Newest first', value: 'newest' },
        ...(!completedEngagement ? [{ label: 'Starting soon', value: 'startingSoon' }] : []),
        ...(kind === 'reviews' ? [{ label: 'Highest payment', value: 'highestPayment' }] : []),
    ]
}

/**
 * Keeps a selected sort valid when another filter changes its available choices.
 *
 * @param kind active opportunity domain.
 * @param status newly selected owner status.
 * @param value currently selected sort value.
 * @returns the current value when still supported, otherwise the default sort.
 * @throws Does not throw.
 */
export function normalizeOpportunitySort(kind: OpportunityKind, status: string, value: string): string {
    return opportunitySortOptions(kind, status)
        .some(option => option.value === value)
        ? value
        : defaultSort()
}
