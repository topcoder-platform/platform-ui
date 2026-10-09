/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { PropsWithChildren } from 'react'
import { render, screen, within } from '@testing-library/react'

import { ChallengeDetailContext } from '../../contexts'
import type { AiWorkflowRun } from '../../hooks'
import { AiWorkflowRunStatusEnum, useFetchAiWorkflowsRuns } from '../../hooks'
import type { AiReviewDecision, ChallengeDetailContextModel } from '../../models'

import AiReviewsTable from './AiReviewsTable'

jest.mock('../../contexts', () => {
    const React: typeof import('react') = jest.requireActual('react')

    return {
        ChallengeDetailContext: React.createContext({}),
    }
})

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: {
            V6: 'https://api.topcoder-dev.com/v6',
        },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrGetAsync: jest.fn(),
    xhrGetBlobAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/shared/lib/utils/handle-error', () => ({
    handleError: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/shared', () => ({
    useWindowSize: () => ({ height: 900, width: 1440 }),
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <span />

    return {
        IconOutline: new Proxy({}, { get: () => Icon }),
        Tooltip: (props: PropsWithChildren<unknown>) => <>{props.children}</>,
    }
}, { virtual: true })

jest.mock('react-router-dom', () => ({
    Link: (props: PropsWithChildren<{ to: string }>) => <a href={props.to}>{props.children}</a>,
}))

jest.mock('swr', () => ({
    useSWRConfig: () => ({ mutate: jest.fn() }),
}))

jest.mock('../../hooks', () => ({
    ...jest.requireActual('../../hooks/useFetchAiWorkflowRuns'),
    useFetchAiWorkflowsRuns: jest.fn(),
    useRolePermissions: () => ({
        hasCopilotRole: false,
        hasSubmitterRole: false,
        isAdmin: false,
        isProjectManager: false,
    }),
}))

jest.mock('../../assets/icons', () => ({
    IconAiReview: () => <span />,
}))

jest.mock('../../../config/index.config', () => ({
    TABLE_DATE_FORMAT: 'MMM DD, YYYY hh:mm A',
}))

jest.mock('../../services/aiReview.service', () => ({
    getAiReviewDecisionsCacheKey: (configId: string) => `decisions-${configId}`,
}))

jest.mock('./AiWorkflowRunStatus', () => ({
    AiWorkflowRunStatus: (props: { status?: string }) => <span>{`status:${props.status}`}</span>,
}))

const mockedUseFetchAiWorkflowsRuns = useFetchAiWorkflowsRuns as jest.Mock

const WORKFLOW_ID = 'workflow-1'

/**
 * Builds a decision whose breakdown still holds the edited score of the previous run.
 *
 * @returns The AI review decision of submission `submission-1`.
 */
const buildDecision = (): AiReviewDecision => ({
    breakdown: {
        workflows: [{
            isGating: false,
            minimumPassingScore: 80,
            runId: 'edited-run',
            runScore: 90,
            runStatus: AiWorkflowRunStatusEnum.SUCCESS,
            weightPercent: 100,
            workflowId: WORKFLOW_ID,
        }],
    },
    status: 'PASSED',
    submissionId: 'submission-1',
    totalScore: 90,
} as unknown as AiReviewDecision)

/**
 * Builds a run of the configured workflow.
 *
 * @param overrides - Run fields to replace for the current test case.
 * @returns An AI workflow run of `workflow-1`.
 */
const buildRun = (overrides: Partial<AiWorkflowRun>): AiWorkflowRun => ({
    completedAt: '2026-06-05T04:16:06.731Z',
    id: 'edited-run',
    initialScore: 100,
    lastDispatchedAt: '2026-06-05T04:10:45.848Z',
    score: 90,
    startedAt: '2026-06-05T04:10:51.597Z',
    status: AiWorkflowRunStatusEnum.SUCCESS,
    usage: {},
    workflow: {
        id: WORKFLOW_ID,
        name: 'AI Vulnerabilities',
    },
    ...overrides,
} as AiWorkflowRun)

/**
 * Renders the AI reviews table for `submission-1` with the given latest run.
 *
 * @param run - The latest run returned by `useFetchAiWorkflowsRuns`.
 * @returns The table row of `workflow-1`.
 */
const renderWorkflowRow = (run: AiWorkflowRun): HTMLElement => {
    mockedUseFetchAiWorkflowsRuns.mockReturnValue({ isLoading: false, runs: [run] })

    const context = {
        aiReviewConfig: undefined,
        aiReviewDecisionsBySubmissionId: { 'submission-1': buildDecision() },
        isLoadingAiReviewConfig: false,
        isLoadingAiReviewDecisions: false,
        resourceMemberIdMapping: {},
    } as unknown as ChallengeDetailContextModel

    render(
        <ChallengeDetailContext.Provider value={context}>
            <AiReviewsTable
                submission={{ id: 'submission-1', virusScan: true }}
                aiReviewers={[{ aiWorkflowId: WORKFLOW_ID }]}
            />
        </ChallengeDetailContext.Provider>,
    )

    return screen.getByText('AI Vulnerabilities')
        .closest('tr') as HTMLElement
}

describe('AiReviewsTable', () => {
    afterEach(() => {
        mockedUseFetchAiWorkflowsRuns.mockReset()
    })

    it('shows the edited score of a finished run', () => {
        const row = within(renderWorkflowRow(buildRun({})))

        expect(row.getByText('90.00'))
            .toBeTruthy()
        expect(row.getByText('(overriden)'))
            .toBeTruthy()
        expect(row.getByText('status:passed'))
            .toBeTruthy()
    })

    it('clears the previous score while a re-run is in progress', () => {
        const row = within(renderWorkflowRow(buildRun({
            completedAt: undefined,
            id: 're-run',
            initialScore: undefined,
            lastDispatchedAt: '2026-06-05T05:04:25.330Z',
            score: undefined,
            startedAt: undefined,
            status: AiWorkflowRunStatusEnum.DISPATCHED,
        } as unknown as Partial<AiWorkflowRun>)))

        expect(row.queryByText('90.00'))
            .toBeNull()
        expect(row.queryByText('(overriden)'))
            .toBeNull()
        expect(row.getByText('-'))
            .toBeTruthy()
        expect(row.getByText('status:pending'))
            .toBeTruthy()
    })
})
