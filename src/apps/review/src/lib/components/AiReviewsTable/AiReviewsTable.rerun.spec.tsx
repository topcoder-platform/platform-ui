/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { PropsWithChildren } from 'react'
import { render, screen } from '@testing-library/react'

import { useWindowSize } from '~/libs/shared'

import { ChallengeDetailContext } from '../../contexts'
import { useFetchAiWorkflowsRuns } from '../../hooks'
import { AiWorkflowRun, AiWorkflowRunStatusEnum } from '../../hooks/useFetchAiWorkflowRuns'
import type { ChallengeDetailContextModel } from '../../models'

import AiReviewsTable from './AiReviewsTable'

jest.mock('~/config', () => ({
    EnvironmentConfig: { API: { V6: 'https://api.example.com/v6' } },
}), { virtual: true })

jest.mock('~/libs/core', () => ({}), { virtual: true })
jest.mock('~/libs/shared/lib/utils/handle-error', () => ({ handleError: jest.fn() }), { virtual: true })
jest.mock('~/libs/shared', () => ({ useWindowSize: jest.fn() }), { virtual: true })

jest.mock('~/libs/ui', () => ({
    IconOutline: jest.requireActual('@heroicons/react/outline'),
    Tooltip: (props: PropsWithChildren<{}>) => <>{props.children}</>,
}), { virtual: true })

jest.mock('../../../config/index.config', () => ({ TABLE_DATE_FORMAT: 'MMM DD, YYYY hh:mm A' }))

jest.mock('react-router-dom', () => ({
    Link: (props: PropsWithChildren<{ to: string }>) => <a href={props.to}>{props.children}</a>,
}))

jest.mock('../../contexts', () => {
    const React: typeof import('react') = jest.requireActual('react')
    return { ChallengeDetailContext: React.createContext({}) }
})

jest.mock('../../hooks', () => ({
    ...jest.requireActual('../../hooks/useFetchAiWorkflowRuns'),
    useFetchAiWorkflowsRuns: jest.fn(),
    useRolePermissions: () => ({}),
}))

const mockedFetchRuns = useFetchAiWorkflowsRuns as jest.Mock
const mockedWindowSize = useWindowSize as jest.Mock

const latestRun = {
    completedAt: '2026-10-19T17:24:00.000Z',
    id: 'rerun',
    score: 80,
    startedAt: '2026-10-19T17:20:00.000Z',
    status: AiWorkflowRunStatusEnum.SUCCESS,
    usage: {},
    workflow: {
        id: 'requirements',
        name: 'Submission Requirements Workflow',
        scorecard: { minimumPassingScore: 75 },
    },
} as AiWorkflowRun

const context = {
    aiReviewConfig: {
        id: 'config',
        workflows: [{
            isGating: false,
            weightPercent: 50,
            workflow: latestRun.workflow,
            workflowId: latestRun.workflow.id,
        }],
    },
    aiReviewDecisionsBySubmissionId: {
        submission: {
            breakdown: {
                workflows: [{
                    isGating: false,
                    minimumPassingScore: 75,
                    runId: 'original-run',
                    runScore: 72,
                    runStatus: AiWorkflowRunStatusEnum.SUCCESS,
                    weightPercent: 50,
                    workflowId: latestRun.workflow.id,
                }],
            },
            submissionLocked: false,
        },
    },
    resourceMemberIdMapping: {},
} as unknown as ChallengeDetailContextModel

/**
 * Renders the AI review table with a stale decision to exercise rerun updates.
 * @param value - Challenge context supplying configuration and saved decision scores.
 * @returns The table element used by render and rerender in desktop/mobile tests.
 * @throws Does not throw.
 */
function table(value: ChallengeDetailContextModel = context): JSX.Element {
    return (
        <ChallengeDetailContext.Provider value={value}>
            <AiReviewsTable submission={{ id: 'submission' }} />
        </ChallengeDetailContext.Provider>
    )
}

describe.each([1280, 768])('AI review scores at width %i', width => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedWindowSize.mockReturnValue({ width })
        mockedFetchRuns.mockReturnValue({ isLoading: false, runs: [latestRun] })
    })

    it('updates 72/Failed to 80/Passed after a rerun while the decision still contains 72', () => {
        mockedFetchRuns.mockReturnValue({
            isLoading: false,
            runs: [{ ...latestRun, id: 'original-run', score: 72 }],
        })
        const rendered = render(table())
        expect(screen.getByRole('link', { name: '72.00' }))
            .toBeTruthy()
        expect(screen.getByText('Failed'))
            .toBeTruthy()

        mockedFetchRuns.mockReturnValue({ isLoading: false, runs: [latestRun] })
        rendered.rerender(table())

        expect(screen.getByRole('link', { name: '80.00' })
            .getAttribute('href'))
            .toBe('../reviews/submission?workflowId=requirements')
        expect(screen.queryByText('72.00'))
            .toBeNull()
        expect(screen.getByText('Passed'))
            .toBeTruthy()
        expect(screen.queryByText('Failed'))
            .toBeNull()
        expect(screen.getByText('75.00'))
            .toBeTruthy()
        expect(screen.getByText('50%'))
            .toBeTruthy()
    })

    it('uses a zero score from the latest run', () => {
        mockedFetchRuns.mockReturnValue({ isLoading: false, runs: [{ ...latestRun, score: 0 }] })
        render(table())

        expect(screen.getByRole('link', { name: '0.00' }))
            .toBeTruthy()
        expect(screen.queryByText('72.00'))
            .toBeNull()
        expect(screen.getByText('Failed'))
            .toBeTruthy()
    })

    it.each([
        [AiWorkflowRunStatusEnum.IN_PROGRESS, 'To be filled'],
        [AiWorkflowRunStatusEnum.FAILURE, 'Failure'],
        [AiWorkflowRunStatusEnum.CANCELLED, 'Cancelled'],
        [AiWorkflowRunStatusEnum.TIMEOUT, 'Timeout'],
    ])('uses the latest %s status without restoring the previous score', (status, label) => {
        mockedFetchRuns.mockReturnValue({
            isLoading: false,
            // The API returns null until a run has a score.
            runs: [{ ...latestRun, score: null, status }], // eslint-disable-line unicorn/no-null
        })
        render(table())

        expect(screen.queryByText('72.00'))
            .toBeNull()
        expect(screen.getAllByText(label).length)
            .toBeGreaterThan(0)
        expect(screen.queryByText('Failed'))
            .toBeNull()
    })

    it('falls back to the decision when no workflow run is available', () => {
        mockedFetchRuns.mockReturnValue({ isLoading: false, runs: [] })
        render(table())

        expect(screen.getByRole('link', { name: '72.00' }))
            .toBeTruthy()
        expect(screen.getByText('Failed'))
            .toBeTruthy()
    })

    it('renders the latest run without a saved decision', () => {
        render(table({ ...context, aiReviewDecisionsBySubmissionId: {} }))

        expect(screen.getByRole('link', { name: '80.00' }))
            .toBeTruthy()
        expect(screen.getByText('Passed'))
            .toBeTruthy()
    })
})
