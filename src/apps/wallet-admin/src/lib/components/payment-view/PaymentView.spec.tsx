/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import React from 'react'
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import { Winning } from '../../models/WinningDetail'
import {
    fetchWinningPaymentDetails,
} from '../../services/wallet'
import { PaymentView } from '.'

jest.mock('../../services/wallet', () => ({
    fetchAuditLogs: jest.fn(),
    fetchPayoutAuditLogs: jest.fn(),
    fetchWinningPaymentDetails: jest.fn(),
    getMemberHandle: jest.fn(),
}))

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        label: string
        onClick: () => void
    }) => (
        <button onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
    Collapsible: (props: {
        children: React.ReactNode
        header: React.ReactNode
    }) => (
        <div>
            {props.header}
            {props.children}
        </div>
    ),
}), { virtual: true })

jest.mock('~/config/environments/default.env', () => ({
    PLATFORMUI_URL: 'https://platform-ui.example.com',
    TOPCODER_URL: 'https://www.example.com',
}), { virtual: true })

jest.mock('~/apps/work', () => ({
    workRootRoute: '/work',
}), { virtual: true })

const mockedFetchWinningPaymentDetails = (
    fetchWinningPaymentDetails as jest.MockedFunction<typeof fetchWinningPaymentDetails>
)
const expectedWorkManagerLink
    = 'https://platform-ui.example.com/work/projects/project-789/engagements/engagement-456/assignments'
        + '?assignmentId=assignment-123'

describe('PaymentView', () => {
    const payment: Winning = {
        createDate: 'Mar 21, 2026',
        currency: 'USD',
        datePaid: '-',
        description: 'Wipro - US Foods - Week Ending: Mar 21, 2026',
        details: [{
            currency: 'USD',
            datePaid: '',
            grossAmount: '463.75',
            id: 'payment-1',
            installmentNumber: 1,
            status: 'OWED',
            totalAmount: '463.75',
        }],
        externalId: 'assignment-123',
        grossAmount: '$463.75',
        grossAmountNumber: 463.75,
        handle: 'vikashchaudhary26',
        id: 'winning-1',
        releaseDate: 'Apr 11, 2026',
        releaseDateObj: new Date('2026-04-11T00:00:00.000Z'),
        status: 'Owed',
        type: 'engagement payment',
    }

    beforeEach(() => {
        mockedFetchWinningPaymentDetails.mockResolvedValue({
            engagementDetails: {
                assignmentId: 'assignment-123',
                billingStartDate: '2026-02-16T00:00:00.000Z',
                durationMonths: 3,
                engagementId: 'engagement-456',
                engagementTitle: 'Snowflake Developer - Vikash',
                otherRemarks: 'Complete onboarding within the first week.',
                projectId: 'project-789',
                projectName: 'Wipro - US Foods',
                ratePerHour: '10.60',
                standardHoursPerWeek: 43.75,
            },
            workLog: {
                hoursWorked: 43.75,
                remarks: 'Completed sprint support and bug triage.',
            },
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders engagement details and a work-manager assignee link for engagement payments', async () => {
        render(<PaymentView payment={payment} />)

        await waitFor(() => {
            expect(mockedFetchWinningPaymentDetails)
                .toHaveBeenCalledWith(payment)
        })

        expect(await screen.findByRole('heading', { name: 'Engagement Details' }))
            .toBeTruthy()
        expect(await screen.findByText('Wipro - US Foods / Snowflake Developer - Vikash'))
            .toBeTruthy()
        await waitFor(() => {
            expect(screen.getAllByText('43.75'))
                .toHaveLength(2)
        })
        expect(await screen.findByText('Completed sprint support and bug triage.'))
            .toBeTruthy()

        const descriptionLink = await screen.findByRole('link', {
            name: 'Wipro - US Foods - Week Ending: Mar 21, 2026',
        })

        expect(descriptionLink.getAttribute('href'))
            .toBe(expectedWorkManagerLink)
    })
})
