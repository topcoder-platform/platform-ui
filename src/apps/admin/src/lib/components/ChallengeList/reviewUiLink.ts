type ChallengeLinkTarget = {
    id?: string | null
    legacyId?: number | string | null
    legacy?: {
        id?: number | string | null
        subTrack?: string
    }
}

const normalizeId = (value: number | string | null | undefined): string | undefined => {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalized = `${value}`.trim()
    return normalized || undefined
}

/**
 * Resolves the best challenge identifier for external links.
 */
export function getChallengeLinkId(
    challenge: ChallengeLinkTarget,
): string | undefined {
    return normalizeId(challenge.id)
        ?? normalizeId(challenge.legacyId)
        ?? normalizeId(challenge.legacy?.id)
}

/**
 * Returns whether the Review UI link can be opened for a challenge.
 */
export function canOpenReviewUi(challengeId?: string): boolean {
    return Boolean(challengeId?.trim())
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
