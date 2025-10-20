const CHALLENGE_DETAILS_SEGMENT = /(active-challenges|past-challenges)\/([^/]+)\/challenge-details/i

/**
 * Builds the review detail route for the current challenge context.
 */
export function getReviewRoute(
    reviewId: string,
    currentPathname?: string,
): string {
    const encodedReviewId = encodeURIComponent(reviewId)
    const pathname = currentPathname
        ?? (typeof window !== 'undefined' ? window.location.pathname : '')

    if (pathname) {
        const match = pathname.match(CHALLENGE_DETAILS_SEGMENT)

        if (match) {
            const matchedSegment = match[0]
            const matchIndex = match.index ?? pathname.indexOf(matchedSegment)
            const prefix = matchIndex > 0
                ? pathname.slice(0, matchIndex)
                    .replace(/\/+$/, '')
                : ''
            const basePath = prefix
                ? `${prefix}/${match[1]}/${match[2]}`
                : `/${match[1]}/${match[2]}`

            return `${basePath}/review/${encodedReviewId}`
        }
    }

    return `/review/${encodedReviewId}`
}
