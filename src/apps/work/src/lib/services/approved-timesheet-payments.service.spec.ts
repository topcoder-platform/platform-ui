/* eslint-disable unicorn/no-null */
import { ApprovedTimesheetRow } from '../models'
import {
    buildApprovedTimesheetPaymentTitle,
    formatApprovedTimesheetWorkPeriod,
} from '../utils/approved-timesheet.utils'

import { createApprovedTimesheetPayments } from './approved-timesheet-payments.service'
import { linkTimesheetEntriesToPayment } from './engagements.service'
import { createMemberPayment } from './payments.service'
import { fetchProjectBillingAccount } from './projects.service'

jest.mock('./engagements.service', () => ({
    linkTimesheetEntriesToPayment: jest.fn(),
}))
jest.mock('./payments.service', () => ({
    createMemberPayment: jest.fn(),
    getPaymentReference: (payment?: { id?: string }) => payment?.id,
}))
jest.mock('./projects.service', () => ({
    fetchProjectBillingAccount: jest.fn(),
}))

const mockedCreateMemberPayment = createMemberPayment as jest.MockedFunction<typeof createMemberPayment>
const mockedLinkEntries = linkTimesheetEntriesToPayment as jest.MockedFunction<
    typeof linkTimesheetEntriesToPayment
>
const mockedFetchBillingAccount = fetchProjectBillingAccount as jest.MockedFunction<
    typeof fetchProjectBillingAccount
>

function buildRow(overrides: Partial<ApprovedTimesheetRow> = {}): ApprovedTimesheetRow {
    return {
        agreementRate: '2000',
        approvalComment: 'Looks good',
        approvedAt: '2026-10-10T10:00:00.000Z',
        approvedBy: '2002',
        approvedByHandle: 'maryj',
        approvedByName: 'Mary Jones',
        assigneeHandle: 'johnsmith',
        assigneeId: '1001',
        assignmentId: 'asg1',
        engagementId: 'eng1',
        engagementTitle: 'Senior Frontend Engineer',
        entryIds: ['entry1', 'entry2'],
        hours: 15.5,
        hoursLeft: 120,
        id: 'asg1:2026-10-10T10:00:00.000Z:2002',
        paymentCycle: 'WEEKLY',
        projectId: '100',
        projectName: 'Acme Portal',
        ratePerHour: '50',
        standardHoursPerDay: 8,
        standardHoursPerWeek: null,
        workPeriodEnd: '2026-10-09',
        workPeriodStart: '2026-10-05',
        ...overrides,
    }
}

describe('approved timesheet payments', () => {
    beforeEach(() => {
        jest.resetAllMocks()
        mockedFetchBillingAccount.mockResolvedValue({
            billingAccount: { active: true, id: 'ba-1' },
        })
        mockedCreateMemberPayment.mockResolvedValue({ id: 'win-1' } as never)
        mockedLinkEntries.mockResolvedValue(undefined)
    })

    it('formats the work period and the Assignees page payment title', () => {
        const row = buildRow()

        expect(formatApprovedTimesheetWorkPeriod(row))
            .toBe('Oct 5, 2026 - Oct 9, 2026')
        expect(buildApprovedTimesheetPaymentTitle(row))
            .toBe('Acme Portal - Senior Frontend Engineer - Work Period Oct 5, 2026 - Oct 9, 2026')
    })

    it('creates a payment with the remarks and links its entries', async () => {
        const [result] = await createApprovedTimesheetPayments([buildRow()], 'See ticket PM-1')

        expect(mockedCreateMemberPayment)
            .toHaveBeenCalledWith(
                'asg1',
                '1001',
                'johnsmith',
                'Acme Portal - Senior Frontend Engineer - Work Period Oct 5, 2026 - Oct 9, 2026',
                'See ticket PM-1',
                '2000',
                775,
                15.5,
                'ba-1',
                ['entry1', 'entry2'],
            )
        expect(mockedLinkEntries)
            .toHaveBeenCalledWith('eng1', 'asg1', ['entry1', 'entry2'], 'win-1')
        expect(result.status)
            .toBe('paid')
    })

    it('loads each project billing account once', async () => {
        await createApprovedTimesheetPayments([
            buildRow(),
            buildRow({ id: 'second' }),
            buildRow({ id: 'third', projectId: '200' }),
        ], '')

        expect(mockedFetchBillingAccount)
            .toHaveBeenCalledTimes(2)
        expect(mockedCreateMemberPayment)
            .toHaveBeenCalledTimes(3)
    })

    it('does not pay rows on a project whose billing account is inactive', async () => {
        mockedFetchBillingAccount.mockResolvedValue({
            billingAccount: { active: false, id: 'ba-1' },
        })

        const [result] = await createApprovedTimesheetPayments([buildRow()], '')

        expect(mockedCreateMemberPayment).not.toHaveBeenCalled()
        expect(result.status)
            .toBe('failed')
        expect(result.message)
            .toContain('inactive')
    })

    it('does not pay a row without an hourly rate', async () => {
        const [result] = await createApprovedTimesheetPayments([
            buildRow({ agreementRate: null, ratePerHour: null }),
        ], '')

        expect(mockedCreateMemberPayment).not.toHaveBeenCalled()
        expect(result.status)
            .toBe('failed')
    })

    it('keeps paying the other rows when one payment fails', async () => {
        mockedCreateMemberPayment
            .mockRejectedValueOnce(new Error('Conflict'))
            .mockResolvedValueOnce({ id: 'win-2' } as never)

        const results = await createApprovedTimesheetPayments([
            buildRow(),
            buildRow({ id: 'second' }),
        ], '')

        expect(results.map(result => result.status))
            .toEqual(['failed', 'paid'])
        expect(results[0].message)
            .toBe('Conflict')
    })

    it('reports a created payment whose entries could not be linked', async () => {
        mockedLinkEntries.mockRejectedValue(new Error('Link failed'))

        const [result] = await createApprovedTimesheetPayments([buildRow()], '')

        expect(result)
            .toEqual(expect.objectContaining({
                message: 'Link failed',
                paymentReference: 'win-1',
                status: 'unlinked',
            }))
    })
})
