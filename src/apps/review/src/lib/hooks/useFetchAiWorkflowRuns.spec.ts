import {
    AiWorkflowRun,
    AiWorkflowRunStatusEnum,
    getLatestAiWorkflowRuns,
} from './useFetchAiWorkflowRuns'

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

/**
 * Builds a minimal AI workflow run fixture for latest-run selection tests.
 *
 * @param overrides - Run fields to replace for the current test case.
 * @returns An AI workflow run of the `workflow-1` workflow.
 */
const buildRun = (overrides: Partial<AiWorkflowRun>): AiWorkflowRun => ({
    completedAt: '2026-06-05T04:16:06.731Z',
    id: 'run-1',
    lastDispatchedAt: '2026-06-05T04:10:45.848Z',
    score: 90,
    startedAt: '2026-06-05T04:10:51.597Z',
    status: AiWorkflowRunStatusEnum.SUCCESS,
    usage: {},
    workflow: {
        id: 'workflow-1',
    },
    ...overrides,
} as AiWorkflowRun)

/**
 * Returns the ids of the latest runs selected by `getLatestAiWorkflowRuns`.
 *
 * @param runs - All runs of a submission.
 * @returns The selected run ids, sorted alphabetically.
 */
const getLatestRunIds = (runs: AiWorkflowRun[]): string[] => getLatestAiWorkflowRuns(runs)
    .map(run => run.id)
    .sort()

describe('getLatestAiWorkflowRuns', () => {
    it('picks a re-run that is dispatched but not started over the previous edited run', () => {
        const editedRun = buildRun({ initialScore: 100 })
        const reRun = buildRun({
            completedAt: undefined,
            id: 'run-2',
            initialScore: undefined,
            lastDispatchedAt: '2026-06-05T05:04:25.330Z',
            score: undefined,
            startedAt: undefined,
            status: AiWorkflowRunStatusEnum.DISPATCHED,
        } as unknown as Partial<AiWorkflowRun>)

        expect(getLatestRunIds([editedRun, reRun]))
            .toEqual(['run-2'])
        expect(getLatestRunIds([reRun, editedRun]))
            .toEqual(['run-2'])
    })

    it('keeps the most recently started run of each workflow', () => {
        const olderRun = buildRun({ id: 'run-1' })
        const newerRun = buildRun({
            completedAt: '2026-06-05T05:05:24.627Z',
            id: 'run-2',
            lastDispatchedAt: '2026-06-05T05:04:25.330Z',
            startedAt: '2026-06-05T05:04:31.460Z',
        })
        const otherWorkflowRun = buildRun({
            id: 'run-3',
            workflow: { id: 'workflow-2' } as AiWorkflowRun['workflow'],
        })

        expect(getLatestRunIds([newerRun, olderRun, otherWorkflowRun]))
            .toEqual(['run-2', 'run-3'])
    })
})
