/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetPaginatedAsync } from '~/libs/core'

import {
    fetchMemberSubmissions,
    fetchMySubmissions,
    fetchSubmissions,
} from './submissions.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: {
            V6: 'https://example.com/v6',
        },
    },
}), {
    virtual: true,
})
jest.mock('~/libs/core', () => ({
    xhrDeleteAsync: jest.fn(),
    xhrGetAsync: jest.fn(),
    xhrGetBlobAsync: jest.fn(),
    xhrGetPaginatedAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
}), {
    virtual: true,
})

describe('community submissions service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('unwraps data/meta submissions responses and maps submitter fields', async () => {
        const mockedGetPaginated = xhrGetPaginatedAsync as jest.Mock

        mockedGetPaginated.mockResolvedValue({
            data: {
                data: [{
                    challengeId: 'challenge-1',
                    createdAt: '2026-06-01T10:02:43.973Z',
                    id: 'submission-1',
                    memberId: '88778748',
                    status: 'ACTIVE',
                    submittedDate: '2026-06-01T10:02:43.972Z',
                    submitterHandle: 'disnadiji',
                    type: 'CONTEST_SUBMISSION',
                    updatedAt: '2026-06-01T10:02:45.716Z',
                    url: undefined,
                }],
                meta: {
                    page: 1,
                    perPage: 500,
                    totalCount: 1,
                    totalPages: 1,
                },
            },
            page: 0,
            perPage: 0,
            total: 0,
            totalPages: 0,
        })

        await expect(fetchSubmissions('challenge-1'))
            .resolves
            .toEqual([
                expect.objectContaining({
                    created: '2026-06-01T10:02:43.972Z',
                    id: 'submission-1',
                    memberHandle: 'disnadiji',
                    updated: '2026-06-01T10:02:45.716Z',
                    url: '',
                }),
            ])
        expect(xhrGetPaginatedAsync)
            .toHaveBeenCalledWith(
                'https://example.com/v6/submissions?challengeId=challenge-1&perPage=500',
            )
    })

    it('keeps compatibility with bare-array submission responses', async () => {
        const mockedGetPaginated = xhrGetPaginatedAsync as jest.Mock

        mockedGetPaginated.mockResolvedValue({
            data: [{
                challengeId: 'challenge-1',
                created: '2026-06-01T09:52:33.677Z',
                id: 'submission-2',
                memberHandle: 'disna56',
                memberId: '88782573',
                status: 'ACTIVE',
                type: 'CONTEST_SUBMISSION',
                updated: '2026-06-01T09:52:35.013Z',
                url: 'https://example.com/submission.zip',
            }],
            page: 1,
            perPage: 500,
            total: 1,
            totalPages: 1,
        })

        await expect(fetchSubmissions('challenge-1'))
            .resolves
            .toEqual([
                expect.objectContaining({
                    created: '2026-06-01T09:52:33.677Z',
                    id: 'submission-2',
                    memberHandle: 'disna56',
                    updated: '2026-06-01T09:52:35.013Z',
                    url: 'https://example.com/submission.zip',
                }),
            ])
    })

    it('applies the same payload handling to member-scoped fetchers', async () => {
        const mockedGetPaginated = xhrGetPaginatedAsync as jest.Mock

        mockedGetPaginated.mockResolvedValue({
            data: {
                data: [{
                    challengeId: 'challenge-1',
                    id: 'submission-3',
                    memberId: '88778748',
                    status: 'ACTIVE',
                    submittedDate: '2026-06-01T10:02:43.972Z',
                    submitterHandle: 'disnadiji',
                    type: 'CONTEST_SUBMISSION',
                    updatedAt: '2026-06-01T10:02:45.716Z',
                }],
            },
            page: 0,
            perPage: 0,
            total: 0,
            totalPages: 0,
        })

        await expect(fetchMySubmissions('challenge-1', '88778748'))
            .resolves
            .toHaveLength(1)
        await expect(fetchMemberSubmissions('88778748'))
            .resolves
            .toHaveLength(1)
    })
})
