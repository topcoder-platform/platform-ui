import { xhrGetAsync } from '~/libs/core'

import type { BackendProjectResult } from '../models'

import { fetchAllProjectResults } from './reviews.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: {
            V6: 'https://api.topcoder.test/v6',
        },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrDeleteAsync: jest.fn(),
    xhrGetAsync: jest.fn(),
    xhrGetBlobAsync: jest.fn(),
    xhrPatchAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
}), { virtual: true })

const mockedXhrGetAsync = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>

/**
 * Creates a backend project-result row for pagination tests.
 *
 * @param overrides fields that differ from the default first-place result.
 * @returns A complete Review API project-result payload.
 */
const buildBackendProjectResult = (
    overrides: Partial<BackendProjectResult> = {},
): BackendProjectResult => ({
    challengeId: 'challenge-id',
    createdAt: '2026-01-05T00:00:00.000Z',
    createdBy: 'review-api',
    finalScore: 81,
    initialScore: 75,
    newRating: 1500,
    passedReview: true,
    paymentId: null, // eslint-disable-line unicorn/no-null
    placement: 1,
    pointAdjustment: null, // eslint-disable-line unicorn/no-null
    rated: false,
    ratingOrder: 1,
    submissionId: 'canonical-submission-1',
    updatedAt: '2026-01-05T00:00:00.000Z',
    updatedBy: 'review-api',
    userId: '1001',
    validSubmission: true,
    ...overrides,
})

describe('fetchAllProjectResults', () => {
    beforeEach(() => {
        mockedXhrGetAsync.mockReset()
    })

    it('fetches every page and globally orders canonical results by placement', async () => {
        mockedXhrGetAsync
            .mockResolvedValueOnce({
                data: [buildBackendProjectResult({
                    placement: 2,
                    submissionId: 'canonical-submission-2',
                    userId: '1002',
                })],
                meta: {
                    page: 1,
                    perPage: 1,
                    totalCount: 2,
                    totalPages: 2,
                },
            } as never)
            .mockResolvedValueOnce({
                data: [buildBackendProjectResult()],
                meta: {
                    page: 2,
                    perPage: 1,
                    totalCount: 2,
                    totalPages: 2,
                },
            } as never)

        const results = await fetchAllProjectResults('challenge-id', 1)

        expect(mockedXhrGetAsync)
            .toHaveBeenNthCalledWith(
                1,
                'https://api.topcoder.test/v6/review/projectResult?challengeId=challenge-id&page=1&perPage=1',
            )
        expect(mockedXhrGetAsync)
            .toHaveBeenNthCalledWith(
                2,
                'https://api.topcoder.test/v6/review/projectResult?challengeId=challenge-id&page=2&perPage=1',
            )
        expect(results.map(result => result.submissionId))
            .toEqual([
                'canonical-submission-1',
                'canonical-submission-2',
            ])
        expect(results.map(result => result.placement))
            .toEqual([1, 2])
    })

    it('does not request project results without a challenge id', async () => {
        await expect(fetchAllProjectResults('', 1))
            .resolves
            .toEqual([])
        expect(mockedXhrGetAsync)
            .not.toHaveBeenCalled()
    })
})
