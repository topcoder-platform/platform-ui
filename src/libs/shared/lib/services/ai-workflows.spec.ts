/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    xhrGetAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    bulkIngestChallengesInRag,
    ingestChallengeInRag,
    WorkflowPollTimeoutError,
} from './ai-workflows'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: { V6: 'https://example.com/v6' },
        RAG_CHALLENGE_BULK_INGESTION_WORKFLOW_ID: 'challenge-bulk-ingestion',
        RAG_CHALLENGE_INGESTION_WORKFLOW_ID: 'challenge-ingestion',
        TC_AI_API: 'https://example.com/v6/ai',
    },
}), {
    virtual: true,
})
jest.mock('~/libs/core', () => ({
    xhrGetAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
}), {
    virtual: true,
})

const mockedPost = xhrPostAsync as jest.Mock
const mockedGet = xhrGetAsync as jest.Mock

/** A completed bulk run, as the workflow's aggregate-reports step shapes it. */
const BULK_REPORT = {
    dryRun: false,
    failed: 1,
    forceSplits: [],
    processed: 3,
    results: [
        { challengeId: 'c-1', chunks: 4, name: 'One', status: 'success' },
        { challengeId: 'c-2', chunks: 0, error: 'boom', name: 'Two', status: 'failed' },
        { challengeId: 'c-3', chunks: 2, name: 'Three', skipped: true, status: 'success' },
    ],
    skipped: 1,
    succeeded: 2,
    totalChunks: 6,
}

describe('bulkIngestChallengesInRag', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedPost.mockResolvedValue({ runId: 'run-1' })
        mockedGet.mockResolvedValue({ result: BULK_REPORT, status: 'success' })
    })

    it('creates a run, starts it, then polls to completion', async () => {
        await bulkIngestChallengesInRag({ projectId: '17423' })

        expect(mockedPost.mock.calls[0][0])
            .toBe('https://example.com/v6/ai/workflows/challenge-bulk-ingestion/create-run')
        expect(mockedPost.mock.calls[1][0])
            .toBe('https://example.com/v6/ai/workflows/challenge-bulk-ingestion/start?runId=run-1')
        expect(mockedGet)
            .toHaveBeenCalledWith(
                'https://example.com/v6/ai/workflows/challenge-bulk-ingestion/runs/run-1',
            )
    })

    it('flattens the aggregate report into run counts and failures', async () => {
        await expect(bulkIngestChallengesInRag({})).resolves.toEqual({
            chunks: 6,
            dryRun: false,
            failed: 1,
            failures: [{ challengeId: 'c-2', error: 'boom', name: 'Two' }],
            processed: 3,
            skipped: 1,
            succeeded: 2,
        })
    })

    it('reads a missing counter as 0 rather than surfacing undefined', async () => {
        mockedGet.mockResolvedValue({ result: {}, status: 'success' })

        await expect(bulkIngestChallengesInRag({})).resolves.toEqual({
            chunks: 0,
            dryRun: false,
            failed: 0,
            failures: [],
            processed: 0,
            skipped: 0,
            succeeded: 0,
        })
    })

    it('sends only the filters the operator actually set', async () => {
        await bulkIngestChallengesInRag({
            dryRun: true,
            projectId: '17423',
            status: undefined,
            tracks: [],
            types: ['Challenge'],
            updatedDateStart: '',
        })

        expect(mockedPost.mock.calls[1][1])
            .toEqual({
                inputData: { dryRun: true, projectId: '17423', types: ['Challenge'] },
            })
    })

    it('passes dryRun: false through, since it is a meaningful value', async () => {
        await bulkIngestChallengesInRag({ dryRun: false, projectId: '1' })

        expect(mockedPost.mock.calls[1][1].inputData)
            .toHaveProperty('dryRun', false)
    })

    it('surfaces a failed run as an error, not as a zeroed report', async () => {
        mockedGet.mockResolvedValue({ error: { message: 'index offline' }, status: 'failed' })

        await expect(bulkIngestChallengesInRag({})).rejects.toThrow(/index offline/)
    })

    it('throws WorkflowPollTimeoutError, not a generic Error, when polling gives up', async () => {
        // Bulk runs poll for 15 minutes, so drive the clock rather than waiting.
        jest.useFakeTimers()
        // A run that never leaves `running` exhausts the poll window.
        mockedGet.mockResolvedValue({ status: 'running' })

        try {
            let rejection: unknown
            const promise = bulkIngestChallengesInRag({})
                .catch(error => {
                    rejection = error
                })

            // This jest runtime predates advanceTimersByTimeAsync, so flush the
            // pending xhr promise before releasing each poll interval.
            for (let i = 0; i < 1000 && rejection === undefined; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await Promise.resolve()
                // eslint-disable-next-line no-await-in-loop
                await Promise.resolve()
                jest.advanceTimersByTime(2000)
            }

            await promise

            // Distinguishable from a real failure so callers can report "still
            // running" — the run does continue server-side.
            expect(rejection)
                .toBeInstanceOf(WorkflowPollTimeoutError)
        } finally {
            jest.useRealTimers()
        }
    })

    it('falls back to the configured workflow id when none is passed', async () => {
        await bulkIngestChallengesInRag({})

        expect(mockedPost.mock.calls[0][0])
            .toContain('/workflows/challenge-bulk-ingestion/')
    })
})

describe('ingestChallengeInRag', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedPost.mockResolvedValue({ runId: 'run-1' })
        mockedGet.mockResolvedValue({
            result: { chunks: 4, dryRun: false, projectId: '17423', skipped: false },
            status: 'success',
        })
    })

    it('sends dryRun so a preview really skips the vector upsert', async () => {
        // Regression: the panel exposed a dry-run toggle that the single-challenge
        // path never forwarded, so it silently wrote to the index anyway.
        await ingestChallengeInRag('c-1', { dryRun: true })

        expect(mockedPost.mock.calls[1][1])
            .toEqual({
                inputData: { challengeId: 'c-1', dryRun: true },
            })
    })

    it('defaults dryRun to false when no options are passed', async () => {
        await ingestChallengeInRag('c-1')

        expect(mockedPost.mock.calls[1][1])
            .toEqual({
                inputData: { challengeId: 'c-1', dryRun: false },
            })
    })

    it('reports back the workflow\'s own dryRun flag, not the request', async () => {
        mockedGet.mockResolvedValue({
            result: { chunks: 4, dryRun: true, skipped: false },
            status: 'success',
        })

        await expect(ingestChallengeInRag('c-1', { dryRun: true })).resolves.toMatchObject({
            chunks: 4,
            dryRun: true,
        })
    })

    it('honours an explicit workflowId override', async () => {
        await ingestChallengeInRag('c-1', { workflowId: 'custom-wf' })

        expect(mockedPost.mock.calls[0][0])
            .toContain('/workflows/custom-wf/create-run')
    })

    it('rejects an empty challenge id before starting a run', async () => {
        await expect(ingestChallengeInRag('')).rejects.toThrow(/non-empty string/)
        expect(mockedPost).not.toHaveBeenCalled()
    })
})
