/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'

import type { SubmissionReviewerRow } from './types'
import {
    renderReviewScoreCell,
    renderScoreCell,
} from './TableColumnRenderers'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        REVIEW: {
            PROFILE_PAGE_URL: 'https://profiles.test',
        },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    getRatingColor: () => '#2a2a2a',
}), { virtual: true })

jest.mock('~/libs/shared', () => ({
    copyTextToClipboard: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const React = jest.requireActual('react')

    return {
        IconOutline: {
            DocumentDuplicateIcon: () => React.createElement('span'),
        },
        Tooltip: (props: { children: React.ReactNode }) => (
            React.createElement(React.Fragment, undefined, props.children)
        ),
    }
}, { virtual: true })

const buildMarathonSubmission = (): SubmissionReviewerRow => {
    const submission = {
        aggregateScore: 88,
        id: 'submission-1',
        memberId: 'member-1',
    }

    return {
        ...submission,
        aggregated: {
            averageFinalScore: 0,
            averageFinalScoreDisplay: '0.00',
            id: submission.id,
            reviews: [
                {
                    finalScore: 0,
                    reviewId: 'review-1',
                    status: 'COMPLETED',
                },
            ],
            submission,
        },
        isFirstReviewerRow: true,
        isLastReviewerRow: true,
        reviewerIndex: 0,
    }
}

describe('TableColumnRenderers marathon score display', () => {
    it('renders the aggregate score instead of the scorecard average for Review Score', () => {
        render(renderReviewScoreCell(buildMarathonSubmission(), {
            canDisplayScores: () => true,
            canViewScorecard: true,
            isAppealsTab: false,
            useAggregateScore: true,
        }))

        expect(screen.getByText('88.00'))
            .toBeTruthy()
        expect(screen.queryByText('0.00'))
            .toBeNull()
    })

    it('renders aggregate Score as plain text without a scorecard link', () => {
        const rendered: ReturnType<typeof render> = render(renderScoreCell(
            buildMarathonSubmission(),
            0,
            {
                canDisplayScores: () => true,
                canViewScorecard: true,
                isAppealsTab: false,
                useAggregateScore: true,
            },
        ))

        expect(screen.getByText('88.00'))
            .toBeTruthy()
        expect(rendered.container.querySelector('a'))
            .toBeNull()
    })
})
