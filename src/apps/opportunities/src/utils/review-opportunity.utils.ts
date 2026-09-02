import { ReviewOpportunity } from '../models'

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
