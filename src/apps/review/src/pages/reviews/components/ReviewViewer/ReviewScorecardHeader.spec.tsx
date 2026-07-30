/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import type { ReviewInfo } from '~/apps/review/src/lib/models'
import type { UseReviewEditAccessResult } from '~/apps/review/src/lib/hooks'

import { ReviewScorecardHeader } from './ReviewScorecardHeader'

const mockUseChallengeDetailsContext = jest.fn()

jest.mock('~/apps/review/src/lib', () => ({
    useChallengeDetailsContext: () => mockUseChallengeDetailsContext(),
}), { virtual: true })

jest.mock('~/apps/review/src/lib/components/ProgressBar', () => ({
    ProgressBar: () => <div data-testid='progress-bar' />,
}), { virtual: true })

jest.mock('~/apps/review/src/lib/assets/icons', () => ({
    IconDeepseekAi: () => <svg />,
    IconPhaseReview: () => <svg />,
    IconPremium: () => <svg />,
}), { virtual: true })

const reviewInfo = {
    resourceId: 'resource-1',
} as ReviewInfo

type ReviewPhaseType = UseReviewEditAccessResult['reviewPhaseType']

/**
 * Render the scorecard header with a normalized review phase type for label assertions.
 * @param reviewPhaseType phase classification returned by the review edit-access hook
 * @returns nothing; the rendered component is queried through Testing Library's screen
 * @throws This helper does not throw.
 */
const renderHeader = (reviewPhaseType?: ReviewPhaseType): void => {
    render(
        <ReviewScorecardHeader
            reviewInfo={reviewInfo}
            reviewPhaseType={reviewPhaseType}
            reviewProgress={0}
        />,
    )
}

describe('ReviewScorecardHeader', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseChallengeDetailsContext.mockReturnValue({
            resources: [
                {
                    handleColor: '#2a2a2a',
                    id: 'resource-1',
                    memberHandle: 'darakmember',
                },
            ],
        })
    })

    it.each([
        'screening',
        'checkpoint screening',
    ] as ReviewPhaseType[])('shows screening labels for the %s phase', reviewPhaseType => {
        renderHeader(reviewPhaseType)

        expect(screen.getByRole('heading', { name: 'Complete Screening Scorecard' }))
            .toBeInTheDocument()
        expect(screen.getByText('Screener:'))
            .toBeInTheDocument()
        expect(screen.getByText('darakmember'))
            .toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Edit Review Scorecard' }))
            .not
            .toBeInTheDocument()
        expect(screen.queryByText('Reviewer:'))
            .not
            .toBeInTheDocument()
    })

    it.each([
        'review',
        'checkpoint review',
        undefined,
    ] as ReviewPhaseType[])('keeps review labels for the %s phase', reviewPhaseType => {
        renderHeader(reviewPhaseType)

        expect(screen.getByRole('heading', { name: 'Edit Review Scorecard' }))
            .toBeInTheDocument()
        expect(screen.getByText('Reviewer:'))
            .toBeInTheDocument()
        expect(screen.getByText('darakmember'))
            .toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Complete Screening Scorecard' }))
            .not
            .toBeInTheDocument()
        expect(screen.queryByText('Screener:'))
            .not
            .toBeInTheDocument()
    })
})
