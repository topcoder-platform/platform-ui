import {
    formatInstantReviewLabel,
    formatReviewModeLabel,
    getInstantReviewStyleItem,
    getReviewStyleModeItem,
    hasAiReviewConfig,
    isDevelopmentChallengeTrack,
} from './ai-review-config.utils'

describe('ai-review-config.utils', () => {
    it('detects development tracks', () => {
        expect(isDevelopmentChallengeTrack('Development'))
            .toBe(true)
        expect(isDevelopmentChallengeTrack({ name: 'Dev' }))
            .toBe(true)
        expect(isDevelopmentChallengeTrack('Design'))
            .toBe(false)
    })

    it('formats review mode labels', () => {
        expect(formatReviewModeLabel())
            .toBe('Manual (Manual review)')
        expect(formatReviewModeLabel({ instantReview: false, mode: 'AI_ONLY' }))
            .toBe('AI only (AI review)')
        expect(formatReviewModeLabel({ instantReview: true, mode: 'AI_GATING' }))
            .toBe('AI Gating (AI review + Manual review)')
    })

    it('formats instant review and detects AI config presence', () => {
        expect(formatInstantReviewLabel(true))
            .toBe('ON')
        expect(formatInstantReviewLabel(false))
            .toBe('OFF')
        expect(hasAiReviewConfig())
            .toBe(false)
        expect(hasAiReviewConfig({ instantReview: true, mode: 'AI_ONLY' }))
            .toBe(true)
    })

    it('returns sidebar review-style list items with tooltips', () => {
        expect(getReviewStyleModeItem())
            .toEqual({
                label: 'Manual',
                tooltip: 'Community Review Board performs a thorough review based on scorecards.',
            })
        expect(getReviewStyleModeItem({ instantReview: false, mode: 'AI_ONLY' }))
            .toEqual({
                label: 'AI only',
                tooltip: 'AI will perform a thorough review based on scorecards.',
            })
        expect(getInstantReviewStyleItem(false))
            .toEqual({
                label: 'Instant Review is Off',
                tooltip: 'You will not receive AI feedback during the submission phase.',
            })
    })
})
