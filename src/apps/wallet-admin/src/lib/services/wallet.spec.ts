/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetAsync } from '~/libs/core'
import { getPaginatedAsync } from '~/libs/core/lib/xhr/xhr-functions/xhr.functions'

import { Winning } from '../models/WinningDetail'
import {
    fetchActionLog,
    fetchActionLogAdminIds,
    fetchChallengePaymentSummary,
    fetchPaymentActionRoleMemberIds,
    fetchTrolleyLogs,
    fetchWinningPaymentDetails,
    getMemberContacts,
} from './wallet'

jest.mock('~/apps/work/src/lib/services/challenges.service', () => ({
    fetchChallenge: jest.fn(),
}), {
    virtual: true,
})
jest.mock('~/config/environments/default.env', () => ({
    CHALLENGE_API_URL: 'https://example.com/v6/challenges',
    CHALLENGE_API_VERSION: 'v5',
}), {
    virtual: true,
})
jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: {
            V6: 'https://example.com/v6',
        },
        TC_FINANCE_API: 'https://example.com/v6/finance',
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
        get: jest.fn(),
    })),
    xhrDeleteAsync: jest.fn(),
    xhrGetAsync: jest.fn(),
    xhrPatchAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
}), {
    virtual: true,
})
jest.mock('~/libs/core/lib/xhr/xhr-functions/xhr.functions', () => ({
    getPaginatedAsync: jest.fn(),
    postAsyncWithBlobHandling: jest.fn(),
}), {
    virtual: true,
})

describe('fetchWinningPaymentDetails', () => {
    const payment: Winning = {
        assignmentId: 'assignment-123',
        createDate: 'Apr 04, 2026',
        currency: 'USD',
        datePaid: '-',
        description: 'V6 project - test eng prj ch - Week Ending: Apr 04, 2026',
        details: [{
            currency: 'USD',
            datePaid: '',
            grossAmount: '2400',
            id: 'detail-1',
            installmentNumber: 1,
            status: 'OWED',
            totalAmount: '2400',
        }],
        externalId: 'engagement-456',
        grossAmount: '$2,400.00',
        grossAmountNumber: 2400,
        handle: 'sathya22in',
        id: 'winning-1',
        releaseDate: 'Apr 17, 2026',
        releaseDateObj: new Date('2026-04-17T00:00:00.000Z'),
        status: 'On Hold (Admin)',
        totalAmount: '$2,400.00',
        totalAmountNumber: 2400,
        type: 'engagement payment',
        winnerId: '40123456',
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('hydrates missing engagement details from the assignment context endpoint', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync
            .mockResolvedValueOnce({
                data: {
                    workLog: {
                        hoursWorked: 40,
                        remarks: 'Test',
                    },
                },
                status: 'success',
            })
            .mockResolvedValueOnce({
                assignmentId: 'assignment-123',
                durationMonths: 3,
                engagementId: 'engagement-456',
                engagementTitle: 'Snowflake Developer',
                otherRemarks: 'Complete onboarding within the first week.',
                projectId: 'project-789',
                projectName: 'V6 project',
                ratePerHour: '60',
                standardHoursPerWeek: 40,
                startDate: '2026-02-16T00:00:00.000Z',
            })

        const result = await fetchWinningPaymentDetails(payment)

        expect(result)
            .toEqual({
                engagementDetails: {
                    assignmentId: 'assignment-123',
                    billingStartDate: '2026-02-16T00:00:00.000Z',
                    durationMonths: 3,
                    engagementId: 'engagement-456',
                    engagementTitle: 'Snowflake Developer',
                    otherRemarks: 'Complete onboarding within the first week.',
                    projectId: 'project-789',
                    projectName: 'V6 project',
                    ratePerHour: '60',
                    standardHoursPerWeek: 40,
                },
                workLog: {
                    hoursWorked: 40,
                    remarks: 'Test',
                },
            })
        expect(mockedGetAsync)
            .toHaveBeenNthCalledWith(
                1,
                'https://example.com/v6/finance/admin/winnings/winning-1/payment-details',
            )
        expect(mockedGetAsync)
            .toHaveBeenNthCalledWith(
                2,
                'https://example.com/v6/engagements/engagements/assignments/assignment-123/context',
            )
    })

    it('falls back to the engagement endpoint when assignment context lookup fails', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync
            .mockResolvedValueOnce({
                data: {
                    workLog: {
                        hoursWorked: 40,
                        remarks: 'Test',
                    },
                },
                status: 'success',
            })
            .mockRejectedValueOnce(new Error('assignment not found'))
            .mockResolvedValueOnce({
                assignments: [
                    {
                        durationMonths: 3,
                        id: 'assignment-123',
                        memberHandle: 'sathya22in',
                        memberId: '40123456',
                        otherRemarks: 'Complete onboarding within the first week.',
                        ratePerHour: '60',
                        standardHoursPerWeek: 40,
                        startDate: '2026-02-16T00:00:00.000Z',
                    },
                ],
                id: 'engagement-456',
                projectId: 'project-789',
                projectName: 'V6 project',
                title: 'Snowflake Developer',
            })

        const result = await fetchWinningPaymentDetails(payment)

        expect(result)
            .toEqual({
                engagementDetails: {
                    assignmentId: 'assignment-123',
                    billingStartDate: '2026-02-16T00:00:00.000Z',
                    durationMonths: 3,
                    engagementId: 'engagement-456',
                    engagementTitle: 'Snowflake Developer',
                    otherRemarks: 'Complete onboarding within the first week.',
                    projectId: 'project-789',
                    projectName: 'V6 project',
                    ratePerHour: '60',
                    standardHoursPerWeek: 40,
                },
                workLog: {
                    hoursWorked: 40,
                    remarks: 'Test',
                },
            })
        expect(mockedGetAsync)
            .toHaveBeenNthCalledWith(
                2,
                'https://example.com/v6/engagements/engagements/assignments/assignment-123/context',
            )
        expect(mockedGetAsync)
            .toHaveBeenNthCalledWith(
                3,
                'https://example.com/v6/engagements/engagements/engagement-456',
            )
    })
})

describe('fetchChallengePaymentSummary', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('maps challenge createdBy and approvalApprovedBy to summary handles', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync.mockResolvedValueOnce({
            approvalApprovedBy: 'kartik',
            createdBy: 'wendell',
        })

        const result = await fetchChallengePaymentSummary('challenge-1')

        expect(result)
            .toEqual({
                budgetApproverHandle: 'kartik',
                creatorHandle: 'wendell',
                paymentApproverHandle: 'kartik',
            })
        expect(mockedGetAsync)
            .toHaveBeenCalledWith(
                'https://example.com/v6/challenges/challenge-1',
                expect.any(Object),
            )
    })

    it('resolves numeric user ids through the member API', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync
            .mockResolvedValueOnce({
                approvalApprovedBy: '2002',
                createdBy: '1001',
            })
            .mockResolvedValueOnce([{ handle: 'wendell', userId: 1001 }])
            .mockResolvedValueOnce([{ handle: 'kartik', userId: 2002 }])

        const result = await fetchChallengePaymentSummary('challenge-1')

        expect(result)
            .toEqual({
                budgetApproverHandle: 'kartik',
                creatorHandle: 'wendell',
                paymentApproverHandle: 'kartik',
            })
    })
})

describe('fetchTrolleyLogs', () => {
    const mockedXhrGetAsync = xhrGetAsync as jest.Mock

    beforeEach(() => {
        mockedXhrGetAsync.mockReset()
    })

    it('requests everything since October 2025 when no period is given', async () => {
        mockedXhrGetAsync.mockResolvedValueOnce({ data: [], status: 'success' })

        await fetchTrolleyLogs()

        expect(mockedXhrGetAsync)
            .toHaveBeenCalledWith('https://example.com/v6/finance/admin/payment-releases/duplicates')
    })

    it('passes the period in days', async () => {
        mockedXhrGetAsync.mockResolvedValueOnce({ data: [], status: 'success' })

        await fetchTrolleyLogs(30)

        expect(mockedXhrGetAsync)
            .toHaveBeenCalledWith('https://example.com/v6/finance/admin/payment-releases/duplicates?days=30')
    })

    it('throws when the API reports an error', async () => {
        mockedXhrGetAsync.mockResolvedValueOnce({ data: undefined, status: 'error' })

        await expect(fetchTrolleyLogs())
            .rejects
            .toThrow('Error fetching Trolley logs')
    })
})

describe('fetchActionLog', () => {
    const mockedXhrGetAsync = xhrGetAsync as jest.Mock

    beforeEach(() => {
        mockedXhrGetAsync.mockReset()
    })

    const dateFrom = new Date('2026-10-01T00:00:00.000Z')
    const dateTo = new Date('2026-10-31T23:59:59.999Z')

    it('passes the date range', async () => {
        mockedXhrGetAsync.mockResolvedValueOnce({ data: [], status: 'success' })

        await fetchActionLog({ dateFrom, dateTo })

        expect(mockedXhrGetAsync)
            .toHaveBeenCalledWith(
                'https://example.com/v6/finance/admin/action-log'
                + '?dateFrom=2026-10-01T00%3A00%3A00.000Z&dateTo=2026-10-31T23%3A59%3A59.999Z',
            )
    })

    it('passes the payment source, categories and admin', async () => {
        mockedXhrGetAsync.mockResolvedValueOnce({ data: [], status: 'success' })

        await fetchActionLog({
            adminUserId: '88774634',
            categories: ['TASK_PAYMENT', 'CONTEST_PAYMENT'],
            dateFrom,
            dateTo,
            paymentSource: 'TOPCODER',
        })

        const url = new URL(mockedXhrGetAsync.mock.calls[0][0])
        expect(url.pathname)
            .toBe('/v6/finance/admin/action-log')
        expect(Object.fromEntries(url.searchParams))
            .toEqual({
                adminUserId: '88774634',
                categories: 'TASK_PAYMENT,CONTEST_PAYMENT',
                dateFrom: '2026-10-01T00:00:00.000Z',
                dateTo: '2026-10-31T23:59:59.999Z',
                paymentSource: 'TOPCODER',
            })
    })

    it('throws when the API reports an error', async () => {
        mockedXhrGetAsync.mockResolvedValueOnce({ data: undefined, status: 'error' })

        await expect(fetchActionLog({ dateFrom, dateTo }))
            .rejects
            .toThrow('Error fetching action log')
    })
})

describe('fetchActionLogAdminIds', () => {
    const mockedXhrGetAsync = xhrGetAsync as jest.Mock

    beforeEach(() => {
        mockedXhrGetAsync.mockReset()
    })

    it('returns the admin user IDs', async () => {
        mockedXhrGetAsync.mockResolvedValueOnce({ data: ['1001', '88774634'], status: 'success' })

        await expect(fetchActionLogAdminIds())
            .resolves
            .toEqual(['1001', '88774634'])
        expect(mockedXhrGetAsync)
            .toHaveBeenCalledWith('https://example.com/v6/finance/admin/action-log/admins')
    })

    it('throws when the API reports an error', async () => {
        mockedXhrGetAsync.mockResolvedValueOnce({ data: undefined, status: 'error' })

        await expect(fetchActionLogAdminIds())
            .rejects
            .toThrow('Error fetching action log admins')
    })
})

describe('fetchPaymentActionRoleMemberIds', () => {
    const mockedXhrGetAsync = xhrGetAsync as jest.Mock
    const mockedGetPaginatedAsync = getPaginatedAsync as jest.Mock

    beforeEach(() => {
        mockedXhrGetAsync.mockReset()
        mockedGetPaginatedAsync.mockReset()
    })

    it('lists the members of the roles that can change payments', async () => {
        mockedXhrGetAsync.mockResolvedValueOnce([
            { id: 1, roleName: 'Payment Admin' },
            { id: 2, roleName: 'payment editor' },
            { id: 3, roleName: 'Payment Viewer' },
            { id: 4, roleName: 'Topcoder User' },
        ])
        mockedGetPaginatedAsync.mockImplementation(async (url: string) => (url.includes('/roles/1/')
            ? { data: [{ userId: 1001 }, { userId: 1002 }], totalPages: 1 }
            : { data: [{ userId: 1002 }, { userId: undefined }, { userId: 1003 }], totalPages: 1 }))

        await expect(fetchPaymentActionRoleMemberIds())
            .resolves
            .toEqual(['1001', '1002', '1003'])
        expect(mockedXhrGetAsync)
            .toHaveBeenCalledWith('https://example.com/v6/roles')
        expect(mockedGetPaginatedAsync.mock.calls.map(call => call[0]))
            .toEqual([
                'https://example.com/v6/roles/1/subjects?page=1&perPage=200',
                'https://example.com/v6/roles/2/subjects?page=1&perPage=200',
            ])
    })

    it('pages through large roles', async () => {
        mockedXhrGetAsync.mockResolvedValueOnce([{ id: 1, roleName: 'Payment Admin' }])
        const fullPage = Array.from({ length: 200 }, (_, index) => ({ userId: index + 1 }))
        mockedGetPaginatedAsync
            .mockResolvedValueOnce({ data: fullPage, totalPages: 2 })
            .mockResolvedValueOnce({ data: [{ userId: 201 }], totalPages: 2 })

        const userIds = await fetchPaymentActionRoleMemberIds()

        expect(userIds)
            .toHaveLength(201)
        expect(mockedGetPaginatedAsync)
            .toHaveBeenCalledTimes(2)
        expect(mockedGetPaginatedAsync)
            .toHaveBeenLastCalledWith('https://example.com/v6/roles/1/subjects?page=2&perPage=200')
    })
})

describe('getMemberContacts', () => {
    const mockedXhrGetAsync = xhrGetAsync as jest.Mock

    beforeEach(() => {
        mockedXhrGetAsync.mockReset()
    })

    it('requests handle, email and name for each member once', async () => {
        mockedXhrGetAsync.mockResolvedValueOnce([
            {
                email: 'wallet.admin@topcoder.com',
                firstName: 'Wallet',
                handle: 'wallet_admin',
                lastName: 'Admin',
                userId: 88774634,
            },
        ])

        const result = await getMemberContacts(['88774634', '88774634', ''])

        expect(mockedXhrGetAsync)
            .toHaveBeenCalledWith(
                'https://example.com/v6/members?userIds[]=88774634'
                + '&fields=userId,handle,email,firstName,lastName&perPage=1',
            )
        expect(result.get('88774634')?.email)
            .toBe('wallet.admin@topcoder.com')
    })

    it('requests at most 50 members at a time', async () => {
        mockedXhrGetAsync.mockResolvedValue([])

        await getMemberContacts(Array.from({ length: 51 }, (_, i) => String(i + 1)))

        expect(mockedXhrGetAsync)
            .toHaveBeenCalledTimes(2)
        expect(mockedXhrGetAsync.mock.calls[0][0])
            .toContain('?userIds[]=1&userIds[]=2&')
        expect(mockedXhrGetAsync.mock.calls[1][0])
            .toContain('?userIds[]=51&fields=')
    })

    it('skips user IDs that are not numeric', async () => {
        mockedXhrGetAsync.mockResolvedValueOnce([])

        await getMemberContacts(['88774634', 'abc123@clients', ' 500021412 ', '[5]'])

        expect(mockedXhrGetAsync)
            .toHaveBeenCalledWith(
                'https://example.com/v6/members?userIds[]=88774634&userIds[]=500021412'
                + '&fields=userId,handle,email,firstName,lastName&perPage=2',
            )
    })

    it('makes no request when there are no members', async () => {
        await getMemberContacts([])

        expect(mockedXhrGetAsync)
            .not.toHaveBeenCalled()
    })
})
