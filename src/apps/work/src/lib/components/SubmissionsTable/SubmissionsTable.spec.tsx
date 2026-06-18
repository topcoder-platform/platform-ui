/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'

import { SubmissionsTable } from './SubmissionsTable'

jest.mock('~/libs/ui', () => ({
    IconOutline: {
        ClockIcon: (): JSX.Element => <svg data-testid='clock-icon' />,
        XCircleIcon: (): JSX.Element => <svg data-testid='x-circle-icon' />,
    },
    IconSolid: {
        CheckCircleIcon: (): JSX.Element => <svg data-testid='check-circle-icon' />,
    },
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
    getSubmissionExampleScore: (
        submission: { reviewSummation?: Array<{ aggregateScore?: number, isExample?: boolean }> },
    ) => (
        submission.reviewSummation
            ?.find(item => item.isExample === true)
            ?.aggregateScore
    ),
    getSubmissionFinalScore: (submission: { review?: Array<{ finalScore?: number }> }) => (
        submission.review?.[0]?.finalScore ?? 0
    ),
    getSubmissionInitialScore: (submission: { review?: Array<{ initialScore?: number }> }) => (
        submission.review?.[0]?.initialScore ?? 0
    ),
    getSubmissionProvisionalScore: (
        submission: { reviewSummation?: Array<{ aggregateScore?: number, isProvisional?: boolean }> },
    ) => (
        submission.reviewSummation
            ?.find(item => item.isProvisional === true)
            ?.aggregateScore
    ),
    getSubmissionSystemScore: (
        submission: { reviewSummation?: Array<{ aggregateScore?: number, isFinal?: boolean }> },
    ) => (
        submission.reviewSummation
            ?.find(item => item.isFinal === true)
            ?.aggregateScore
    ),
    getSubmissionTestProgress: (
        submission: {
            reviewSummation?: Array<{
                metadata?: {
                    testProcess?: 'example' | 'provisional' | 'system'
                    testProgress?: number
                    testStatus?: 'FAILED' | 'IN PROGRESS' | 'SUCCESS'
                    testType?: 'example' | 'provisional' | 'system'
                }
            }>
        },
    ) => {
        const metadata = submission.reviewSummation?.[0]?.metadata
        const progress = metadata?.testProgress

        return {
            process: metadata?.testProcess ?? metadata?.testType,
            progressPercent: typeof progress === 'number'
                ? `${Math.round(progress * 100)}%`
                : undefined,
            status: metadata?.testStatus,
        }
    },
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
jest.mock('../../assets/icons/IconRunnerLogs.svg', () => ({
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

    it('renders and triggers the runner logs action when enabled', () => {
        const onOpenRunnerLogs = jest.fn()

        render(
            <SubmissionsTable
                canDownloadSubmissions
                canViewRunnerLogs
                challengeId='challenge-123'
                onDownloadSubmission={jest.fn()}
                onOpenArtifacts={jest.fn()}
                onOpenRunnerLogs={onOpenRunnerLogs}
                onSort={jest.fn()}
                sortBy='createdAt'
                sortOrder='desc'
                submissions={[
                    {
                        challengeId: 'challenge-123',
                        createdBy: 'member-1',
                        id: 'submission-1',
                        type: 'SUBMISSION',
                    },
                ]}
            />,
        )

        screen.getByRole('button', { name: 'View runner logs' })
            .click()

        expect(onOpenRunnerLogs)
            .toHaveBeenCalledWith('submission-1')
    })

    it('hides the runner logs action when disabled', () => {
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
                        type: 'SUBMISSION',
                    },
                ]}
            />,
        )

        expect(screen.queryByRole('button', { name: 'View runner logs' }))
            .toBeNull()
    })

    it('renders marathon test progress columns when enabled', () => {
        render(
            <SubmissionsTable
                canDownloadSubmissions
                challengeId='challenge-123'
                onDownloadSubmission={jest.fn()}
                onOpenArtifacts={jest.fn()}
                onSort={jest.fn()}
                showMarathonMatchTestProgress
                sortBy='createdAt'
                sortOrder='desc'
                submissions={[
                    {
                        challengeId: 'challenge-123',
                        createdBy: 'member-1',
                        id: 'submission-1',
                        reviewSummation: [
                            {
                                metadata: {
                                    testProcess: 'system',
                                    testProgress: 0.75,
                                    testStatus: 'IN PROGRESS',
                                },
                            },
                        ],
                        type: 'SUBMISSION',
                    },
                    {
                        challengeId: 'challenge-123',
                        createdBy: 'member-2',
                        id: 'submission-2',
                        reviewSummation: [
                            {
                                metadata: {
                                    testProcess: 'provisional',
                                    testProgress: 1,
                                    testStatus: 'SUCCESS',
                                },
                            },
                        ],
                        type: 'SUBMISSION',
                    },
                    {
                        challengeId: 'challenge-123',
                        createdBy: 'member-3',
                        id: 'submission-3',
                        reviewSummation: [
                            {
                                metadata: {
                                    testProcess: 'system',
                                    testProgress: 0.2,
                                    testStatus: 'FAILED',
                                },
                            },
                        ],
                        type: 'SUBMISSION',
                    },
                ]}
            />,
        )

        expect(screen.getByText('Current tests process'))
            .toBeTruthy()
        expect(screen.getByText('Test status'))
            .toBeTruthy()
        expect(screen.getByText('Test progress'))
            .toBeTruthy()
        expect(screen.getByText('75%'))
            .toBeTruthy()
        expect(screen.getByText('100%'))
            .toBeTruthy()
        expect(screen.getByText('20%'))
            .toBeTruthy()
        expect(screen.getByRole('img', { name: 'Test status: IN PROGRESS' }))
            .toBeTruthy()
        expect(screen.getByRole('img', { name: 'Test status: SUCCESS' }))
            .toBeTruthy()
        expect(screen.getByRole('img', { name: 'Test status: FAILED' }))
            .toBeTruthy()
    })

    it('renders marathon scores from provisional and system summations only', () => {
        render(
            <SubmissionsTable
                canDownloadSubmissions
                challengeId='challenge-123'
                onDownloadSubmission={jest.fn()}
                onOpenArtifacts={jest.fn()}
                onSort={jest.fn()}
                showMarathonMatchTestProgress
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
                        reviewSummation: [
                            {
                                aggregateScore: 12,
                                isProvisional: true,
                            },
                        ],
                        type: 'SUBMISSION',
                    },
                    {
                        challengeId: 'challenge-123',
                        createdBy: 'member-2',
                        id: 'submission-2',
                        review: [
                            {
                                finalScore: 85,
                                initialScore: 80,
                            },
                        ],
                        reviewSummation: [
                            {
                                aggregateScore: 20,
                                isFinal: true,
                            },
                        ],
                        type: 'SUBMISSION',
                    },
                ]}
            />,
        )

        expect(screen.getByRole('link', { name: '12.00 / -' }))
            .toBeTruthy()
        expect(screen.getByRole('link', { name: '- / 20.00' }))
            .toBeTruthy()
        expect(screen.queryByRole('link', { name: '90.00 / 95.00' }))
            .toBeNull()
        expect(screen.queryByRole('link', { name: '80.00 / 85.00' }))
            .toBeNull()
    })

    it('renders example validation process and score for marathon submissions', () => {
        render(
            <SubmissionsTable
                canDownloadSubmissions
                challengeId='challenge-123'
                onDownloadSubmission={jest.fn()}
                onOpenArtifacts={jest.fn()}
                onSort={jest.fn()}
                showMarathonMatchTestProgress
                sortBy='createdAt'
                sortOrder='desc'
                submissions={[
                    {
                        challengeId: 'challenge-123',
                        createdBy: 'member-1',
                        id: 'submission-1',
                        reviewSummation: [
                            {
                                aggregateScore: 15.25,
                                isExample: true,
                                metadata: {
                                    testProgress: 1,
                                    testStatus: 'SUCCESS',
                                    testType: 'example',
                                },
                            },
                        ],
                        type: 'SUBMISSION',
                    },
                ]}
            />,
        )

        expect(screen.getByRole('link', { name: '15.25 / -' }))
            .toBeTruthy()
        expect(screen.getByText('Example'))
            .toBeTruthy()
        expect(screen.getByText('100%'))
            .toBeTruthy()
        expect(screen.getByRole('img', { name: 'Test status: SUCCESS' }))
            .toBeTruthy()
    })

    it('renders failed example validation scores for marathon submissions', () => {
        render(
            <SubmissionsTable
                canDownloadSubmissions
                challengeId='challenge-123'
                onDownloadSubmission={jest.fn()}
                onOpenArtifacts={jest.fn()}
                onSort={jest.fn()}
                showMarathonMatchTestProgress
                sortBy='createdAt'
                sortOrder='desc'
                submissions={[
                    {
                        challengeId: 'challenge-123',
                        createdBy: 'member-1',
                        id: 'submission-1',
                        reviewSummation: [
                            {
                                aggregateScore: -1,
                                isExample: true,
                                metadata: {
                                    testProgress: 1,
                                    testStatus: 'FAILED',
                                    testType: 'example',
                                },
                            },
                        ],
                        type: 'SUBMISSION',
                    },
                ]}
            />,
        )

        expect(screen.getByRole('link', { name: '-1.00 / -' }))
            .toBeTruthy()
        expect(screen.getByText('Example'))
            .toBeTruthy()
        expect(screen.getByText('100%'))
            .toBeTruthy()
        expect(screen.getByRole('img', { name: 'Test status: FAILED' }))
            .toBeTruthy()
    })
})
