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
    getReviewSummationMarathonTestType: (reviewSummation: {
        isFinal?: boolean
        isProvisional?: boolean
        metadata?: {
            testProcess?: string
            testType?: string
        }
    }) => {
        const testType = reviewSummation.metadata?.testType
            || reviewSummation.metadata?.testProcess

        if (testType === 'system' || reviewSummation.isFinal) {
            return 'system'
        }

        if (testType === 'provisional' || reviewSummation.isProvisional) {
            return 'provisional'
        }

        return undefined
    },
    getSubmissionFinalScore: (submission: { review?: Array<{ finalScore?: number }> }) => (
        submission.review?.[0]?.finalScore ?? 0
    ),
    getSubmissionInitialScore: (submission: { review?: Array<{ initialScore?: number }> }) => (
        submission.review?.[0]?.initialScore ?? 0
    ),
    getSubmissionMarathonTestSummations: (
        submission: {
            reviewSummation?: Array<{
                isFinal?: boolean
                isProvisional?: boolean
                metadata?: {
                    testProcess?: string
                    testType?: string
                }
            }>
        },
        testTypeFilter: string = 'all',
    ) => (submission.reviewSummation || []).filter(reviewSummation => {
        const testType = reviewSummation.metadata?.testType
            || reviewSummation.metadata?.testProcess
            || (reviewSummation.isFinal ? 'system' : undefined)
            || (reviewSummation.isProvisional ? 'provisional' : undefined)

        return testTypeFilter === 'all'
            ? testType === 'provisional' || testType === 'system'
            : testType === testTypeFilter
    }),
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

    it('does not render a submission history action in the actions column', () => {
        render(
            <SubmissionsTable
                canDownloadSubmissions
                challengeId='challenge-123'
                onDownloadSubmission={jest.fn()}
                onOpenArtifacts={jest.fn()}
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

        expect(screen.queryByRole('button', { name: 'View submission history' }))
            .toBeNull()
        expect(screen.getByRole('button', { name: 'Download submission' }))
            .toBeTruthy()
        expect(screen.getByRole('button', { name: 'Download submission artifacts' }))
            .toBeTruthy()
    })

    it('renders selected marathon match test process status and progress', () => {
        render(
            <SubmissionsTable
                canDownloadSubmissions
                challengeId='challenge-123'
                marathonMatchTestType='system'
                onDownloadSubmission={jest.fn()}
                onOpenArtifacts={jest.fn()}
                onSort={jest.fn()}
                showMarathonMatchTestProcess
                sortBy='createdAt'
                sortOrder='desc'
                submissions={[
                    {
                        challengeId: 'challenge-123',
                        createdBy: 'member-1',
                        id: 'submission-1',
                        reviewSummation: [
                            {
                                id: 'provisional-summation',
                                metadata: {
                                    testProgress: 1,
                                    testStatus: 'SUCCESS',
                                    testType: 'provisional',
                                },
                            },
                            {
                                id: 'system-summation',
                                metadata: {
                                    testProgress: 0.5,
                                    testStatus: 'IN PROGRESS',
                                    testType: 'system',
                                },
                            },
                        ],
                        type: 'SUBMISSION',
                    },
                ]}
            />,
        )

        expect(screen.getByText('Test Status'))
            .toBeTruthy()
        expect(screen.getByText('Test Progress'))
            .toBeTruthy()
        expect(screen.getAllByText('System:').length)
            .toBe(2)
        expect(screen.getByText('In Progress'))
            .toBeTruthy()
        expect(screen.getByText('50%'))
            .toBeTruthy()
        expect(screen.queryByText('Provisional:'))
            .toBeNull()
    })
})
