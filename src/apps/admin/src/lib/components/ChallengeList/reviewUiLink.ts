/**
 * Returns whether the Review UI link can be opened for a challenge.
 */
export function canOpenReviewUi(challengeId?: string): boolean {
    return Boolean(challengeId)
}

/**
 * Builds the Review UI URL for a challenge id.
 */
export function getReviewUiChallengeUrl(
    reviewUiBaseUrl: string,
    challengeId: string,
): string {
    return `${reviewUiBaseUrl}/${challengeId}`
}
