/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetAsync } from '~/libs/core'

import { Winning } from '../models/WinningDetail'
import { fetchWinningPaymentDetails } from './wallet'

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
    xhrDeleteAsync: jest.fn(),
    xhrGetAsync: jest.fn(),
    xhrPatchAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
}), {
    virtual: true,
})
jest.mock('~/libs/core/lib/xhr/xhr-functions/xhr.functions', () => ({
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
