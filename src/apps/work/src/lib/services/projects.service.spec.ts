/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    xhrGetAsync,
    xhrGetPaginatedAsync,
} from '~/libs/core'

import {
    fetchProjectBillingAccount,
    fetchProjectBillingAccounts,
    fetchProjectsList,
} from './projects.service'

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
    xhrCreateInstance: jest.fn(() => ({
        defaults: {
            headers: {
                common: {},
            },
        },
    })),
    xhrDeleteAsync: jest.fn(),
    xhrGetAsync: jest.fn(),
    xhrGetPaginatedAsync: jest.fn(),
    xhrPatchAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
    xhrPutAsync: jest.fn(),
}), {
    virtual: true,
})
jest.mock('../constants', () => ({
    ATTACHMENT_TYPE_FILE: 'FILE',
    FILE_PICKER_SUBMISSION_CONTAINER_NAME: 'submissions',
    GENERIC_PROJECT_MILESTONE_PRODUCT_NAME: 'milestone',
    GENERIC_PROJECT_MILESTONE_PRODUCT_TYPE: 'milestone-type',
    PHASE_PRODUCT_CHALLENGE_ID_FIELD: 'challengeId',
    PHASE_PRODUCT_TEMPLATE_ID: 1,
    PROJECT_STATUS: {
        ACTIVE: 'active',
    },
    PROJECTS_API_URL: 'https://example.com/projects',
    PROJECTS_PAGE_SIZE: 20,
}))
jest.mock('./project-member-invites.service', () => ({
    createProjectMemberInvite: jest.fn(),
}))

describe('fetchProjectBillingAccount', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('loads markup from the billing-accounts API when the project billing account omits it', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync
            .mockResolvedValueOnce({
                active: true,
                endDate: '2026-10-16T23:59:00.000Z',
                name: 'BA For Marios',
                startDate: '2023-10-31T00:00:00.000Z',
                tcBillingAccountId: 80001063,
            })
            .mockResolvedValueOnce({
                id: 80001063,
                markup: '0.33',
                name: 'BA For Marios',
            })

        const result = await fetchProjectBillingAccount('100578')

        expect(result)
            .toEqual({
                billingAccount: {
                    active: true,
                    endDate: '2026-10-16T23:59:00.000Z',
                    id: '80001063',
                    markup: 0.33,
                    name: 'BA For Marios',
                    startDate: '2023-10-31T00:00:00.000Z',
                },
            })
        expect(mockedGetAsync)
            .toHaveBeenNthCalledWith(
                1,
                'https://example.com/projects/100578/billingAccount',
            )
        expect(mockedGetAsync)
            .toHaveBeenNthCalledWith(
                2,
                'https://example.com/v6/billing-accounts/80001063',
            )
    })

    it('loads markup from the billing-accounts API when the project billing account returns blank markup', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync
            .mockResolvedValueOnce({
                active: true,
                endDate: '2026-10-16T23:59:00.000Z',
                markup: '   ',
                name: 'BA For Marios',
                startDate: '2023-10-31T00:00:00.000Z',
                tcBillingAccountId: 80001063,
            })
            .mockResolvedValueOnce({
                id: 80001063,
                markup: '0.33',
                name: 'BA For Marios',
            })

        const result = await fetchProjectBillingAccount('100578')

        expect(result)
            .toEqual({
                billingAccount: {
                    active: true,
                    endDate: '2026-10-16T23:59:00.000Z',
                    id: '80001063',
                    markup: 0.33,
                    name: 'BA For Marios',
                    startDate: '2023-10-31T00:00:00.000Z',
                },
            })
        expect(mockedGetAsync)
            .toHaveBeenNthCalledWith(
                1,
                'https://example.com/projects/100578/billingAccount',
            )
        expect(mockedGetAsync)
            .toHaveBeenNthCalledWith(
                2,
                'https://example.com/v6/billing-accounts/80001063',
            )
    })

    it('preserves project markup while enriching billing details from the billing-accounts API', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync
            .mockResolvedValueOnce({
                active: true,
                endDate: '2026-10-16T23:59:00.000Z',
                markup: '0.33',
                name: 'BA For Marios',
                startDate: '2023-10-31T00:00:00.000Z',
                tcBillingAccountId: 80001063,
            })
            .mockResolvedValueOnce({
                active: true,
                id: 80001063,
                markup: '0.99',
                status: 'ACTIVE',
                totalBudgetRemaining: '2500',
            })

        const result = await fetchProjectBillingAccount('100578')

        expect(result)
            .toEqual({
                billingAccount: {
                    active: true,
                    endDate: '2026-10-16T23:59:00.000Z',
                    id: '80001063',
                    markup: 0.33,
                    name: 'BA For Marios',
                    startDate: '2023-10-31T00:00:00.000Z',
                    status: 'ACTIVE',
                    totalBudgetRemaining: 2500,
                },
            })
        expect(mockedGetAsync)
            .toHaveBeenNthCalledWith(
                1,
                'https://example.com/projects/100578/billingAccount',
            )
        expect(mockedGetAsync)
            .toHaveBeenNthCalledWith(
                2,
                'https://example.com/v6/billing-accounts/80001063',
            )
    })
})

describe('fetchProjectBillingAccounts', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('maps project billing accounts into shared billing-account options sorted by name', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync.mockResolvedValue([
            {
                endDate: '2028-10-31T00:00:00.000Z',
                name: 'Platform Dev - Two',
                startDate: '2023-10-31T00:00:00.000Z',
                tcBillingAccountId: 80001059,
            },
            {
                endDate: '2028-10-31T00:00:00.000Z',
                name: 'Platform Dev - One',
                startDate: '2023-10-31T00:00:00.000Z',
                tcBillingAccountId: 80001012,
            },
            {
                endDate: '2028-10-31T00:00:00.000Z',
                name: '',
                startDate: '2023-10-31T00:00:00.000Z',
                tcBillingAccountId: 80001000,
            },
        ])

        const result = await fetchProjectBillingAccounts('100578')

        expect(result)
            .toEqual([
                {
                    active: true,
                    endDate: '2028-10-31T00:00:00.000Z',
                    id: '80001012',
                    name: 'Platform Dev - One',
                    startDate: '2023-10-31T00:00:00.000Z',
                },
                {
                    active: true,
                    endDate: '2028-10-31T00:00:00.000Z',
                    id: '80001059',
                    name: 'Platform Dev - Two',
                    startDate: '2023-10-31T00:00:00.000Z',
                },
            ])
        expect(mockedGetAsync)
            .toHaveBeenCalledWith(
                'https://example.com/projects/100578/billingAccounts',
            )
    })
})

describe('fetchProjectsList', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('preserves the API isInvited flag when invite details are omitted', async () => {
        const mockedGetPaginatedAsync = xhrGetPaginatedAsync as jest.Mock

        mockedGetPaginatedAsync.mockResolvedValue({
            data: [
                {
                    id: 200,
                    isInvited: true,
                    name: 'Invited project',
                    status: 'active',
                },
            ],
            page: 1,
            perPage: 20,
            total: 1,
            totalPages: 1,
        })

        const result = await fetchProjectsList()

        expect(result.projects)
            .toEqual([
                expect.objectContaining({
                    id: 200,
                    invites: [],
                    isInvited: true,
                    members: [],
                    name: 'Invited project',
                    status: 'active',
                }),
            ])
        expect(mockedGetPaginatedAsync)
            .toHaveBeenCalledWith(expect.stringContaining('fields=members%2Cinvites'))
    })
})
