/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'

import { SubmissionsTable } from './SubmissionsTable'

jest.mock('~/libs/ui', () => ({
    LoadingSpinner: () => <div>Loading</div>,
}), {
    virtual: true,
})
jest.mock('../../constants', () => ({
    COMMUNITY_APP_URL: 'https://example.com/community',
    REVIEW_APP_URL: 'https://example.com/review',
}))
jest.mock('../../utils', () => ({
    formatDateTime: (value: string) => value,
    getRatingLevel: () => 'gray',
    getSubmissionFinalScore: (submission: { review?: Array<{ finalScore?: number }> }) => (
        submission.review?.[0]?.finalScore ?? 0
    ),
    getSubmissionInitialScore: (submission: { review?: Array<{ initialScore?: number }> }) => (
        submission.review?.[0]?.initialScore ?? 0
    ),
}))
jest.mock('../../assets/icons/IconDownloadArtifacts.svg', () => ({
    ReactComponent: () => <svg aria-hidden='true' />,
}), {
    virtual: true,
})
jest.mock('../../assets/icons/IconSquareDownload.svg', () => ({
    ReactComponent: () => <svg aria-hidden='true' />,
}), {
    virtual: true,
})
jest.mock('./SubmissionsTable.module.scss', () => new Proxy({}, {
    get: (_target, property) => String(property),
}))

describe('SubmissionsTable', () => {
    it('links standard submissions to the review submissions tab', () => {
        render(
            <SubmissionsTable
                canDownloadSubmissions
                challengeId='challenge-123'
                onDownloadSubmission={jest.fn()}
                onOpenArtifacts={jest.fn()}
                onOpenHistory={jest.fn()}
                onSort={jest.fn()}
                sortBy='createdAt'
                sortOrder='desc'
                submissions={[
                    {
                        challengeId: 'challenge-123',
                        createdBy: 'member-1',
                        id: 'submission-1',
                        review: [
                            {
                                finalScore: 95,
                                initialScore: 90,
                            },
                        ],
                        type: 'SUBMISSION',
                    },
                ]}
            />,
        )

        expect(
            screen.getByRole('link', { name: '90.00 / 95.00' })
                .getAttribute('href'),
        )
            .toBe('https://example.com/review/active-challenges/challenge-123/challenge-details?tab=submission')
    })

    it('links checkpoint submissions to the review checkpoint submissions tab', () => {
        render(
            <SubmissionsTable
                canDownloadSubmissions
                challengeId='challenge-123'
                onDownloadSubmission={jest.fn()}
                onOpenArtifacts={jest.fn()}
                onOpenHistory={jest.fn()}
                onSort={jest.fn()}
                sortBy='createdAt'
                sortOrder='desc'
                submissions={[
                    {
                        challengeId: 'challenge-123',
                        createdBy: 'member-1',
                        id: 'submission-1',
                        review: [
                            {
                                finalScore: 85,
                                initialScore: 80,
                            },
                        ],
                        type: 'CHECKPOINT_SUBMISSION',
                    },
                ]}
            />,
        )

        expect(
            screen.getByRole('link', { name: '80.00 / 85.00' })
                .getAttribute('href'),
        )
            .toBe(
                'https://example.com/review/active-challenges/challenge-123/'
                + 'challenge-details?tab=checkpoint-submission',
            )
    })
})
