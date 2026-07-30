/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'

import { ReviewScorecardHeader } from './ReviewScorecardHeader'

jest.mock('~/apps/review/src/lib', () => ({
    useChallengeDetailsContext: () => ({
        resources: [],
    }),
}), { virtual: true })

jest.mock('~/apps/review/src/lib/assets/icons', () => ({
    IconDeepseekAi: () => <></>,
    IconPhaseReview: () => <></>,
    IconPremium: () => <></>,
}), { virtual: true })

jest.mock('~/apps/review/src/lib/components/ProgressBar', () => ({
    ProgressBar: () => <></>,
}), { virtual: true })

describe('ReviewScorecardHeader', () => {
    it('labels the submitter scorecard as read-only details', () => {
        render(<ReviewScorecardHeader isSubmitterView />)

        expect(screen.getByRole('heading', { name: 'Scorecard Details' }))
            .toBeTruthy()
    })

    it('keeps the edit label for non-submitter views', () => {
        render(<ReviewScorecardHeader />)

        expect(screen.getByRole('heading', { name: 'Edit Review Scorecard' }))
            .toBeTruthy()
    })
})
