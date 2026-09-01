/* eslint-disable import/no-extraneous-dependencies */
import { xhrGetAsync } from '~/libs/core'

import {
    chunkSubmissionIds,
    fetchSubmissionDuplicates,
    getSubmissionDuplicatesCacheKey,
} from './submission-duplicates.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: {
            V6: 'https://api.test/v6',
        },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrGetAsync: jest.fn(),
}), { virtual: true })

const xhrGetAsyncMock = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>

describe('submission-duplicates.service', () => {
    beforeEach(() => {
        xhrGetAsyncMock.mockReset()
    })

    describe('chunkSubmissionIds', () => {
        it('splits ids into chunks of at most 100', () => {
            const ids = Array.from({ length: 205 }, (_, index) => `submission-${index}`)

            expect(chunkSubmissionIds(ids)
                .map(chunk => chunk.length))
                .toEqual([100, 100, 5])
        })
    })

    describe('getSubmissionDuplicatesCacheKey', () => {
        it('is stable regardless of submission id order', () => {
            expect(getSubmissionDuplicatesCacheKey('challenge-1', ['b', 'a'], true))
                .toBe(getSubmissionDuplicatesCacheKey('challenge-1', ['a', 'b'], true))
        })

        it('varies with the cross-challenge flag', () => {
            expect(getSubmissionDuplicatesCacheKey('challenge-1', ['a'], true))
                .not
                .toBe(getSubmissionDuplicatesCacheKey('challenge-1', ['a'], false))
        })

        it('is undefined without a challenge or submission ids', () => {
            expect(getSubmissionDuplicatesCacheKey(undefined, ['a']))
                .toBeUndefined()
            expect(getSubmissionDuplicatesCacheKey('challenge-1', []))
                .toBeUndefined()
        })
    })

    describe('fetchSubmissionDuplicates', () => {
        it('requests every submission id and flags cross-challenge matches', async () => {
            xhrGetAsyncMock.mockResolvedValue({
                'submission-1': {
                    duplicates: [
                        {
                            challenge: 'challenge-1',
                            challengeTitle: 'This Challenge',
                            submissionId: 'submission-2',
                            submittedAt: '2026-07-13T09:35:00.000Z',
                            user: 2001,
                        },
                        {
                            challenge: 'challenge-9',
                            challengeTitle: 'Other Challenge',
                            submissionId: 'submission-9',
                            submittedAt: '2026-07-09T11:21:00.000Z',
                            user: '2002',
                        },
                    ],
                },
            } as never)

            const result = await fetchSubmissionDuplicates(
                'challenge-1',
                ['submission-1'],
                true,
            )

            expect(xhrGetAsyncMock)
                .toHaveBeenCalledWith(
                    'https://api.test/v6/submissions/challenge-1/duplicates'
                    + '?submissionId=submission-1&crossChallenge=true',
                )
            expect(result['submission-1'])
                .toEqual([
                    {
                        challenge: 'challenge-1',
                        challengeTitle: 'This Challenge',
                        isCrossChallenge: false,
                        submissionId: 'submission-2',
                        submittedAt: '2026-07-13T09:35:00.000Z',
                        user: '2001',
                    },
                    {
                        challenge: 'challenge-9',
                        challengeTitle: 'Other Challenge',
                        isCrossChallenge: true,
                        submissionId: 'submission-9',
                        submittedAt: '2026-07-09T11:21:00.000Z',
                        user: '2002',
                    },
                ])
        })

        it('omits the cross-challenge flag for same-challenge lookups', async () => {
            xhrGetAsyncMock.mockResolvedValue({} as never)

            await fetchSubmissionDuplicates('challenge-1', ['submission-1'])

            expect(xhrGetAsyncMock)
                .toHaveBeenCalledWith(
                    'https://api.test/v6/submissions/challenge-1/duplicates?submissionId=submission-1',
                )
        })

        it('chunks large id lists into separate requests and merges the results', async () => {
            const ids = Array.from({ length: 101 }, (_, index) => `submission-${index}`)
            xhrGetAsyncMock.mockImplementation(async url => (
                `${url}`.includes('submission-100')
                    ? { 'submission-100': { duplicates: [{ submissionId: 'dup-b' }] } } as never
                    : { 'submission-0': { duplicates: [{ submissionId: 'dup-a' }] } } as never
            ))

            const result = await fetchSubmissionDuplicates('challenge-1', ids, true)

            expect(xhrGetAsyncMock)
                .toHaveBeenCalledTimes(2)
            expect(result['submission-0']?.[0].submissionId)
                .toBe('dup-a')
            expect(result['submission-100']?.[0].submissionId)
                .toBe('dup-b')
        })

        it('deduplicates and trims requested ids', async () => {
            xhrGetAsyncMock.mockResolvedValue({} as never)

            await fetchSubmissionDuplicates(
                'challenge-1',
                [' submission-1 ', 'submission-1', ''],
            )

            expect(xhrGetAsyncMock)
                .toHaveBeenCalledWith(
                    'https://api.test/v6/submissions/challenge-1/duplicates?submissionId=submission-1',
                )
        })

        it('skips the request when there is nothing to check', async () => {
            expect(await fetchSubmissionDuplicates('challenge-1', []))
                .toEqual({})
            expect(await fetchSubmissionDuplicates('', ['submission-1']))
                .toEqual({})
            expect(xhrGetAsyncMock)
                .not
                .toHaveBeenCalled()
        })

        it('tolerates malformed duplicate payloads', async () => {
            xhrGetAsyncMock.mockResolvedValue({
                'submission-1': { duplicates: 'nope' },
                'submission-2': { duplicates: [undefined, {}, { submissionId: 'dup-a' }] },
            } as never)

            const result = await fetchSubmissionDuplicates('challenge-1', ['submission-1'])

            expect(result['submission-1'])
                .toEqual([])
            expect(result['submission-2'])
                .toHaveLength(1)
        })
    })
})
