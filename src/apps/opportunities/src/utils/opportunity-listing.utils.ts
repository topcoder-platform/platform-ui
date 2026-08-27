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
 * @returns common sort options plus the review-only highest-payment choice.
 * @throws Does not throw.
 */
export function opportunitySortOptions(kind: OpportunityKind): OpportunitySortOption[] {
    return [
        { label: 'Newest first', value: 'newest' },
        { label: 'Starting soon', value: 'startingSoon' },
        ...(kind === 'reviews' ? [{ label: 'Highest payment', value: 'highestPayment' }] : []),
    ]
}
