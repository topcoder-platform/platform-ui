/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { fireEvent, render, screen } from '@testing-library/react'

import { SubmissionsTable } from './SubmissionsTable'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        URLS: {
            CHALLENGES_PAGE: 'https://example.com/challenges',
        },
    },
}), {
    virtual: true,
})
jest.mock('~/libs/ui', () => ({
    IconOutline: {
        ChevronDownIcon: (): JSX.Element => <svg data-testid='chevron-down-icon' />,
        ClockIcon: (): JSX.Element => <svg data-testid='clock-icon' />,
        ExclamationIcon: (): JSX.Element => <svg data-testid='exclamation-icon' />,
        ExternalLinkIcon: (): JSX.Element => <svg data-testid='external-link-icon' />,
        LightningBoltIcon: (): JSX.Element => <svg data-testid='lightning-bolt-icon' />,
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

    it('renders N/A only for the marathon score whose tests are in progress', () => {
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
                                aggregateScore: 0,
                                isProvisional: true,
                                metadata: {
                                    testProcess: 'provisional',
                                    testProgress: 0.02,
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
                                aggregateScore: 0,
                                isFinal: true,
                                metadata: {
                                    testProcess: 'system',
                                    testProgress: 0.2,
                                    testStatus: 'IN PROGRESS',
                                },
                            },
                            {
                                aggregateScore: 31.41,
                                isProvisional: true,
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
                                aggregateScore: 0,
                                isProvisional: true,
                                metadata: {
                                    testProcess: 'provisional',
                                    testProgress: 1,
                                    testStatus: 'SUCCESS',
                                },
                            },
                        ],
                        type: 'SUBMISSION',
                    },
                ]}
            />,
        )

        expect(screen.getByRole('link', { name: 'N/A / -' }))
            .toBeTruthy()
        expect(screen.getByRole('link', { name: '31.41 / N/A' }))
            .toBeTruthy()
        expect(screen.getByRole('link', { name: '0.00 / -' }))
            .toBeTruthy()
        expect(screen.queryByRole('link', { name: '0.00 / N/A' }))
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
    describe('duplicate submissions', () => {
        const submissions = [
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
        ]

        function renderWithDuplicates(
            duplicatesBySubmissionId?: Record<string, Array<Record<string, unknown>>>,
        ): void {
            render(
                <SubmissionsTable
                    canDownloadSubmissions
                    challengeId='challenge-123'
                    duplicatesBySubmissionId={duplicatesBySubmissionId as never}
                    onDownloadSubmission={jest.fn()}
                    onOpenArtifacts={jest.fn()}
                    onSort={jest.fn()}
                    sortBy='createdAt'
                    sortOrder='desc'
                    submissions={submissions as never}
                />,
            )
        }

        it('hides the duplicates row when the submission has no duplicates', () => {
            renderWithDuplicates({ 'submission-1': [] })

            expect(screen.queryByRole('button', { name: /duplicate/ }))
                .toBeNull()
        })

        it('hides the duplicates row when duplicates were never fetched', () => {
            renderWithDuplicates(undefined)

            expect(screen.queryByRole('button', { name: /duplicate/ }))
                .toBeNull()
        })

        it('renders a collapsed duplicates row and expands it on click', () => {
            renderWithDuplicates({
                'submission-1': [
                    {
                        challenge: 'challenge-123',
                        isCrossChallenge: false,
                        submissionId: 'PNM4cbZgII428Iv',
                        submittedAt: '2026-07-13T07:39:00.000Z',
                        user: '2001',
                        userHandle: 'taasintake500',
                    },
                    {
                        challenge: 'challenge-999',
                        challengeTitle: 'Basketball Stats App',
                        isCrossChallenge: true,
                        submissionId: '12I.RbObnTFCVt',
                        submittedAt: '2026-07-10T14:15:00.000Z',
                        user: '2002',
                        userHandle: 'testmfa1',
                    },
                ],
            })

            const toggle = screen.getByRole('button', { name: /2 duplicates/ })
            expect(toggle.getAttribute('aria-expanded'))
                .toBe('false')
            expect(screen.queryByText('taasintake500'))
                .toBeNull()

            fireEvent.click(toggle)

            expect(toggle.getAttribute('aria-expanded'))
                .toBe('true')
            expect(screen.getByText('taasintake500'))
                .toBeTruthy()
            expect(screen.getByText('(PNM4cbZgII428Iv)'))
                .toBeTruthy()
            expect(
                screen.getByRole('link', { name: 'Basketball Stats App' })
                    .getAttribute('href'),
            )
                .toBe('https://example.com/challenges/challenge-999')
        })

        it('singularizes the duplicate count label', () => {
            renderWithDuplicates({
                'submission-1': [
                    {
                        challenge: 'challenge-123',
                        isCrossChallenge: false,
                        submissionId: 'other-submission',
                    },
                ],
            })

            expect(screen.getByRole('button', { name: /1 duplicate$/ }))
                .toBeTruthy()
        })

        it('falls back to the member id and a dash when handle or date are missing', () => {
            renderWithDuplicates({
                'submission-1': [
                    {
                        challenge: 'challenge-123',
                        isCrossChallenge: false,
                        submissionId: 'other-submission',
                        user: '2003',
                    },
                ],
            })

            fireEvent.click(screen.getByRole('button', { name: /1 duplicate/ }))

            expect(screen.getByText('2003'))
                .toBeTruthy()
            expect(screen.getByText('- -'))
                .toBeTruthy()
        })
    })
})
