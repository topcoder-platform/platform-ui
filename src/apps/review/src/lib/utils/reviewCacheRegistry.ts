/**
 * Registry tracking SWR cache keys that contain challenge-review data.
 *
 * The registry lets utility functions invalidate every relevant cache entry
 * after mutations (for example, when reopening a review) without needing
 * component-specific context.
 */

const challengeReviewKeyRegistry = new Map<string, Set<string>>()

/**
 * Record a cache key that should be revalidated when review data changes.
 */
export const registerChallengeReviewKey = (challengeId: string | undefined, cacheKey: string | undefined): void => {
    if (!challengeId || !cacheKey) {
        return
    }

    const normalizedKey = cacheKey.trim()
    if (!normalizedKey.length) {
        return
    }

    const registryEntry = challengeReviewKeyRegistry.get(challengeId)
    if (registryEntry) {
        registryEntry.add(normalizedKey)
        return
    }

    challengeReviewKeyRegistry.set(challengeId, new Set<string>([normalizedKey]))
}

/**
 * Retrieve all registered cache keys for the provided challenge.
 */
export const getChallengeReviewKeys = (challengeId: string | undefined): string[] => {
    if (!challengeId) {
        return []
    }

    const entry = challengeReviewKeyRegistry.get(challengeId)
    return entry ? Array.from(entry) : []
}
