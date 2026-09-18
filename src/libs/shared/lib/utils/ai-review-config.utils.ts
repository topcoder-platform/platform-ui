export type AiReviewMode = 'AI_GATING' | 'AI_ONLY'

export interface AiReviewConfigSummary {
    instantReview: boolean
    mode: AiReviewMode
}

export interface ReviewStyleListItem {
    label: string
    tooltip: string
}

function normalizeTrackKey(value?: string | { name?: string; track?: string }): string {
    const raw = typeof value === 'string'
        ? value
        : value?.track ?? value?.name ?? ''

    return raw
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
}

/**
 * Returns true when the challenge track identifies a development challenge.
 */
export function isDevelopmentChallengeTrack(
    track?: string | { name?: string; track?: string },
): boolean {
    const key = normalizeTrackKey(track)

    return key === 'development' || key === 'dev' || key === 'develop'
}

/**
 * Returns the sidebar review-mode bullet label and tooltip.
 */
export function getReviewStyleModeItem(config?: AiReviewConfigSummary): ReviewStyleListItem {
    if (!config) {
        return {
            label: 'Manual',
            tooltip: 'Community Review Board performs a thorough review based on scorecards.',
        }
    }

    if (config.mode === 'AI_GATING') {
        return {
            label: 'AI Gating',
            tooltip: 'AI performs a preliminary review, then the Community Review Board '
                + 'evaluates submissions that pass.',
        }
    }

    return {
        label: 'AI only',
        tooltip: 'AI will perform a thorough review based on scorecards.',
    }
}

/**
 * Returns the member-facing review mode label for challenge details surfaces.
 */
export function formatReviewModeLabel(config?: AiReviewConfigSummary): string {
    return getReviewStyleModeItem(config).label
}

/**
 * Returns whether an AI review configuration is present for the challenge.
 */
export function hasAiReviewConfig(config?: AiReviewConfigSummary): boolean {
    return !!config
}

/**
 * Returns the ON/OFF label for instant review.
 */
export function formatInstantReviewLabel(instantReview: boolean): string {
    return instantReview ? 'ON' : 'OFF'
}

/**
 * Returns the sidebar instant-review bullet label and tooltip.
 */
export function getInstantReviewStyleItem(instantReview: boolean): ReviewStyleListItem {
    if (instantReview) {
        return {
            label: 'Instant Review is On',
            tooltip: 'You will receive AI feedback during the submission phase.',
        }
    }

    return {
        label: 'Instant Review is Off',
        tooltip: 'You will not receive AI feedback during the submission phase.',
    }
}
