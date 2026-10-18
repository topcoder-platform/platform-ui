/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
// Null fixtures mirror the Review API's nullable timestamps and scores.
import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'

import { ChallengeSubmissionAiWorkflowRun } from '../models'
import { formatOpportunityDateTime } from '../utils/opportunity-date.utils'

import { SubmissionAiReviewDetails } from './SubmissionAiReviewDetails'

const mockUseSWR = jest.fn()

jest.mock('swr', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWR(...args),
}))

jest.mock('../services', () => ({
    getChallengeSubmissionAiWorkflowRuns: jest.fn(),
}))

jest.mock('../utils', () => ({
    submissionAiReviewAppUrl: (challengeId: string, submissionId: string, workflowId: string): string => (
        `https://review.example/${challengeId}/${submissionId}?workflowId=${workflowId}`
    ),
}))

/**
 * Creates a Requirements Workflow run based on the QA rerun scenario.
 *
 * @param overrides fields to replace for the tested attempt.
 * @returns a successful run with a nullable start time, as returned by Review API.
 * @throws Does not throw.
 */
function buildRun(overrides: Partial<ChallengeSubmissionAiWorkflowRun> = {}): ChallengeSubmissionAiWorkflowRun {
    return {
        completedAt: '2026-10-16T04:10:34.184Z',
        id: 'original-run',
        lastDispatchedAt: '2026-10-16T04:07:25.176Z',
        score: 72,
        startedAt: null,
        status: 'SUCCESS',
        workflow: {
            id: 'requirements-workflow',
            name: 'Submission Requirements Workflow',
            scorecard: { minimumPassingScore: 75 },
        },
        workflowId: 'requirements-workflow',
        ...overrides,
    }
}

/**
 * Renders the submission details with a controlled workflow API response.
 *
 * @param runs all attempts returned for the submission.
 * @returns the polling interval selected for these attempts.
 * @throws Propagates render errors so the regression test fails.
 */
function renderRuns(runs: ChallengeSubmissionAiWorkflowRun[]): number {
    mockUseSWR.mockReturnValue({ data: runs })
    render(<SubmissionAiReviewDetails challengeId='challenge' id='details' submissionId='submission' />)
    return mockUseSWR.mock.calls.at(-1)?.[2].refreshInterval(runs)
}

describe('SubmissionAiReviewDetails reruns', () => {
    beforeEach(() => jest.clearAllMocks())

    it.each([false, true])('shows only the latest score and date regardless of API order (reversed: %s)', reverse => {
        const latest = buildRun({
            completedAt: '2026-10-16T04:16:07.356Z',
            id: 'rerun',
            lastDispatchedAt: '2026-10-16T04:12:34.454Z',
            score: 92,
        })
        const runs = [
            buildRun(),
            buildRun({ id: 'sast', score: 48, workflowId: 'sast-workflow' }),
            buildRun({ id: 'security', score: 100, workflowId: 'security-workflow' }),
            latest,
        ]
        expect(renderRuns(reverse ? runs.reverse() : runs))
            .toBe(0)

        // Distinct workflow IDs stay visible even when their display names match.
        expect(screen.getAllByRole('row'))
            .toHaveLength(4)
        expect(screen.queryByRole('link', { name: '72' }))
            .not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: '92' }))
            .toHaveAttribute('href', 'https://review.example/challenge/submission?workflowId=requirements-workflow')
        const row = screen.getByRole('row', { name: /92/ })
        expect(within(row)
            .getByRole('cell', { name: formatOpportunityDateTime(latest.completedAt, '-') }))
            .toBeInTheDocument()
        expect(within(row)
            .getByText('PASSED'))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: '48' }))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: '100' }))
            .toBeInTheDocument()
    })

    it.each([
        ['DISPATCHED', 'PENDING', 10000],
        ['IN_PROGRESS', 'PENDING', 10000],
        ['FAILURE', 'FAILED', 0],
    ])('replaces the previous score with the latest %s result', (status, label, interval) => {
        expect(renderRuns([
            buildRun(),
            buildRun({
                completedAt: undefined,
                id: 'rerun',
                lastDispatchedAt: '2026-10-16T04:12:34.454Z',
                score: null,
                status: String(status),
            }),
        ]))
            .toBe(interval)
        expect(screen.getAllByRole('row'))
            .toHaveLength(2)
        expect(screen.queryByRole('link'))
            .not.toBeInTheDocument()
        expect(screen.getByText(label))
            .toBeInTheDocument()
    })

    it('uses start time before completion time and ignores superseded pending runs when polling', () => {
        expect(renderRuns([
            buildRun({ completedAt: '2026-10-16T04:30:00.000Z', startedAt: '2026-10-16T04:07:30.000Z' }),
            buildRun({ id: 'stale-pending', status: 'IN_PROGRESS' }),
            buildRun({
                completedAt: '2026-10-16T04:16:07.356Z',
                id: 'rerun',
                score: 0,
                startedAt: '2026-10-16T04:12:40.000Z',
            }),
        ]))
            .toBe(0)
        expect(screen.getAllByRole('row'))
            .toHaveLength(2)
        expect(screen.getByRole('link', { name: '0' }))
            .toBeInTheDocument()
        expect(screen.getByText('FAILED'))
            .toBeInTheDocument()
    })

    it('falls back to completion time and nested workflow IDs for older responses', () => {
        renderRuns([
            buildRun({ lastDispatchedAt: null, workflowId: undefined }),
            buildRun({
                completedAt: '2026-10-16T04:16:07.356Z',
                id: 'rerun',
                lastDispatchedAt: null,
                score: 92,
                workflowId: undefined,
            }),
        ])
        expect(screen.getAllByRole('row'))
            .toHaveLength(2)
        expect(screen.getByRole('link', { name: '92' }))
            .toHaveAttribute('href', 'https://review.example/challenge/submission?workflowId=requirements-workflow')
    })

    it('keeps runs without workflow identifiers separate', () => {
        renderRuns([
            buildRun({ workflow: undefined, workflowId: undefined }),
            buildRun({ id: 'other-run', score: 92, workflow: undefined, workflowId: undefined }),
        ])
        expect(screen.getAllByRole('row'))
            .toHaveLength(3)
    })
})
