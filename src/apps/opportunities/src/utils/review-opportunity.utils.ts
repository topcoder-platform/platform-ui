import { ReviewOpportunity } from '../models'

/**
 * Normalizes Review API enum and display role names for payment matching.
 *
 * @param value role enum or display label.
 * @returns lowercase alphanumeric role key.
 * @throws Does not throw.
 */
function reviewRoleKey(value?: string): string {
    return (value ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
}

/**
 * Converts a Review API payment value to a finite number.
 *
 * @param value numeric API field.
 * @returns finite payment or undefined.
 * @throws Does not throw.
 */
function finitePayment(value?: number): number | undefined {
    const payment = Number(value)
    return Number.isFinite(payment) ? payment : undefined
}

/**
 * Normalizes one review challenge tag or skill value into a non-empty label.
 *
 * @param value challenge tag, technology, or skill entry from the Review API snapshot.
 * @returns trimmed label, or an empty string when no label is available.
 * @throws Does not throw.
 */
function reviewOpportunityLabel(value: unknown): string {
    if (typeof value === 'string') return value.trim()
    if (value && typeof value === 'object' && 'name' in value) {
        return String(value.name ?? '')
            .trim()
    }

    return ''
}

/**
 * Merges review challenge tags, technologies, and skills for card and detail chips.
 *
 * @param opportunity review opportunity with an optional embedded challenge snapshot.
 * @returns unique non-empty labels in API order.
 * @throws Does not throw.
 */
export function reviewOpportunityLabels(opportunity: ReviewOpportunity): string[] {
    const challengeData = opportunity.challengeData
    const tags = Array.isArray(challengeData?.tags) ? challengeData.tags : []
    const technologies = Array.isArray(challengeData?.technologies) ? challengeData.technologies : []
    const skills = Array.isArray(challengeData?.skills) ? challengeData.skills : []

    return Array.from(new Set([
        ...tags.map(reviewOpportunityLabel),
        ...technologies.map(reviewOpportunityLabel),
        ...skills.map(reviewOpportunityLabel),
    ].filter(Boolean)))
}

/**
 * Calculates compensation for the first reviewed submission. Review API's
 * role payment is the fixed reviewer component and `incrementalPayment` is
 * earned for every reviewed submission, including the first one.
 *
 * @param opportunity Review API opportunity payment contract.
 * @param role optional selected application role.
 * @returns first-submission compensation, or undefined when no base value exists.
 * @throws Does not throw.
 */
export function reviewFirstSubmissionPayment(
    opportunity: ReviewOpportunity,
    role?: string,
): number | undefined {
    const selectedRolePayment = role
        ? opportunity.payments?.find(payment => reviewRoleKey(payment.role) === reviewRoleKey(role))
        : opportunity.payments?.[0]
    const basePayment = finitePayment(selectedRolePayment?.payment ?? opportunity.basePayment)
    if (basePayment === undefined) return undefined

    const incrementalPayment = finitePayment(opportunity.incrementalPayment)
    return basePayment + (incrementalPayment ?? 0)
}
