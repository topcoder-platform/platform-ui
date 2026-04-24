/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import React from 'react'
import {
    render,
    screen,
    waitFor,
    within,
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
    TOPCODER_URL: 'https://www.example.com',
}), { virtual: true })

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        ADMIN: {
            WORK_MANAGER_URL: 'https://challenges.example.com',
        },
    },
}), { virtual: true })

const mockedFetchWinningPaymentDetails = (
    fetchWinningPaymentDetails as jest.MockedFunction<typeof fetchWinningPaymentDetails>
)
const expectedWorkManagerLink
    = 'https://challenges.example.com/projects/project-789/engagements/engagement-456/assignments'
        + '?assignmentId=assignment-123'
const expectedProjectLink
    = 'https://challenges.example.com/projects/project-789'

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
                otherRemarks: 'Complete onboarding within the first week. Docs: https://google.com',
                projectId: 'project-789',
                projectName: 'Wipro - US Foods',
                ratePerHour: '10.60',
                standardHoursPerWeek: 43.75,
            },
            paymentCreatorHandle: 'copilot-manager',
            workLog: {
                hoursWorked: 43.75,
                remarks: 'Completed sprint support and bug triage. Reference: https://example.com/worklog',
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
        await waitFor(() => {
            expect(screen.getAllByText('43.75'))
                .toHaveLength(2)
        })
        expect(await screen.findByText(/Completed sprint support and bug triage\./))
            .toBeTruthy()

        const workLogHeading = await screen.findByRole('heading', {
            name: 'Work Log / Manager Inputs',
        })
        const workLogSection = workLogHeading.parentElement

        if (!workLogSection) {
            throw new Error('Expected work log section to be rendered.')
        }

        expect(screen.getAllByText('Payment Creator'))
            .toHaveLength(1)
        expect(within(workLogSection)
            .getByText('Payment Creator'))
            .toBeTruthy()
        expect(within(workLogSection)
            .getByText('copilot-manager'))
            .toBeTruthy()

        const descriptionLink = await screen.findByRole('link', {
            name: 'Wipro - US Foods - Week Ending: Mar 21, 2026',
        })

        expect(descriptionLink.getAttribute('href'))
            .toBe(expectedWorkManagerLink)

        const projectLink = await screen.findByRole('link', {
            name: 'Wipro - US Foods',
        })

        expect(projectLink.getAttribute('href'))
            .toBe(expectedProjectLink)
        expect(projectLink.getAttribute('target'))
            .toBe('_blank')

        const remarksLink = await screen.findByRole('link', {
            name: 'https://google.com',
        })

        expect(remarksLink.getAttribute('href'))
            .toBe('https://google.com')
        expect(remarksLink.getAttribute('target'))
            .toBe('_blank')

        const workLogRemarksLink = await screen.findByRole('link', {
            name: 'https://example.com/worklog',
        })

        expect(workLogRemarksLink.getAttribute('href'))
            .toBe('https://example.com/worklog')
        expect(workLogRemarksLink.getAttribute('target'))
            .toBe('_blank')
    })

    it('renders task details section for task payments', async () => {
        const taskPayment: Winning = {
            ...payment,
            description: 'Build a cool widget for the dashboard',
            externalId: 'challenge-uuid-1',
            type: 'task payment',
        }

        mockedFetchWinningPaymentDetails.mockResolvedValue({
            paymentCreatorHandle: 'task-creator',
            taskDetails: {
                paymentApproverHandle: 'approver-handle',
                projectId: '42',
                projectName: 'My Awesome Project',
            },
        })

        render(<PaymentView payment={taskPayment} />)

        await waitFor(() => {
            expect(mockedFetchWinningPaymentDetails)
                .toHaveBeenCalledWith(taskPayment)
        })

        expect(await screen.findByRole('heading', { name: 'Task Details' }))
            .toBeTruthy()

        expect(await screen.findByRole('heading', { name: 'Task Details' }))
            .toBeTruthy()
        expect(await screen.findByText('task-creator'))
            .toBeTruthy()
        expect(await screen.findByText('approver-handle'))
            .toBeTruthy()

        const projectLink = await screen.findByRole('link', { name: 'My Awesome Project' })
        expect(projectLink.getAttribute('href'))
            .toBe('https://challenges.example.com/projects/42/challenges/challenge-uuid-1/view')
        expect(projectLink.getAttribute('target'))
            .toBe('_blank')
    })
})
