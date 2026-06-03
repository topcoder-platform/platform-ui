/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import React from 'react'
import {
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Winning } from '../../models/WinningDetail'
import {
    fetchAuditLogs,
    fetchChallengePaymentSummary,
    fetchWinningPaymentDetails,
    getMemberHandle,
} from '../../services/wallet'
import { PaymentView } from '.'

jest.mock('../../services/wallet', () => ({
    fetchAuditLogs: jest.fn(),
    fetchChallengePaymentSummary: jest.fn(),
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
    IconOutline: {
        CheckIcon: () => <span>check-icon</span>,
    },
    IconSolid: {
        ExclamationIcon: () => <span>exclamation-icon</span>,
        XCircleIcon: () => <span>x-icon</span>,
    },
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
const mockedFetchChallengePaymentSummary = (
    fetchChallengePaymentSummary as jest.MockedFunction<typeof fetchChallengePaymentSummary>
)
const mockedFetchAuditLogs = fetchAuditLogs as jest.MockedFunction<typeof fetchAuditLogs>
const mockedGetMemberHandle = getMemberHandle as jest.MockedFunction<typeof getMemberHandle>

const expectedWorkManagerLink
    = 'https://challenges.example.com/projects/project-789/engagements/engagement-456/assignments'
        + '?assignmentId=assignment-123'
const expectedProjectLink
    = 'https://challenges.example.com/projects/project-789'

describe('PaymentView', () => {
    const payment: Winning = {
        createDate: '15/5/2026',
        currency: 'USD',
        datePaid: '30/5/2026',
        description: 'Wipro - US Foods - Week Ending: Mar 21, 2026',
        details: [{
            currency: 'USD',
            datePaid: '',
            grossAmount: '2000',
            id: 'payment-1',
            installmentNumber: 1,
            status: 'OWED',
            totalAmount: '2000',
        }],
        externalId: 'assignment-123',
        grossAmount: '$2,000.00',
        grossAmountNumber: 2000,
        handle: 'disnadiji',
        id: 'winning-1',
        releaseDate: '15/5/2026',
        releaseDateObj: new Date('2026-05-15T00:00:00.000Z'),
        status: 'On Hold (Admin)',
        type: 'engagement payment',
    }

    beforeEach(() => {
        mockedFetchWinningPaymentDetails.mockResolvedValue({
            engagementDetails: {
                assignmentId: 'assignment-123',
                billingStartDate: '2026-02-16T00:00:00.000Z',
                durationMonths: 12,
                engagementId: 'engagement-456',
                paymentApproverHandle: 'TonyJ',
                paymentCycle: 'weekly',
                projectId: 'project-789',
                projectName: 'Test Project Engagement BA',
                ratePerHour: '50',
                standardHoursPerDay: 8,
            },
            paymentCreatorHandle: 'wendell',
            workLog: {
                hoursWorked: 40,
                remarks: 'Member worked 40 hours this week.',
            },
        })
        mockedFetchAuditLogs.mockResolvedValue([])
        mockedFetchChallengePaymentSummary.mockResolvedValue({})
        mockedGetMemberHandle.mockResolvedValue(new Map())
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('renders engagement payment details with tabs and agreement match banner', async () => {
        render(<PaymentView payment={payment} onClose={jest.fn()} />)

        await waitFor(() => {
            expect(mockedFetchWinningPaymentDetails)
                .toHaveBeenCalledWith(payment)
        })

        expect(await screen.findByText('PAYMENT MATCHES AGREEMENT'))
            .toBeTruthy()
        expect(screen.getByText('disnadiji'))
            .toBeTruthy()
        expect(screen.getByText('wendell'))
            .toBeTruthy()
        expect(screen.getByText('Payment Approver'))
            .toBeTruthy()
        expect(screen.getByText('TonyJ'))
            .toBeTruthy()
        expect(screen.getByRole('tab', { name: 'Engagement Details' }))
            .toBeTruthy()

        const descriptionLink = await screen.findByRole('link', {
            name: 'Wipro - US Foods - Week Ending: Mar 21, 2026',
        })

        expect(descriptionLink.getAttribute('href'))
            .toBe(expectedWorkManagerLink)

        await userEvent.click(screen.getByRole('tab', { name: 'Engagement Details' }))

        const projectLink = await screen.findByRole('link', {
            name: 'Test Project Engagement BA',
        })

        expect(projectLink.getAttribute('href'))
            .toBe(expectedProjectLink)
        expect(screen.getByText('Weekly'))
            .toBeTruthy()
        expect(screen.getByText('8'))
            .toBeTruthy()

        await userEvent.click(screen.getByRole('tab', { name: 'Work Log' }))

        expect(await screen.findByText('Member worked 40 hours this week.'))
            .toBeTruthy()
        expect(screen.getAllByText('Payment Creator'))
            .toHaveLength(1)
        expect(screen.queryByText('Payment Approver'))
            .not.toBeNull()
    })

    it('renders task payment details with five-column summary and task details tab', async () => {
        const taskPayment: Winning = {
            ...payment,
            description: 'Build a responsive front-end interface for General Electric.',
            externalId: 'challenge-uuid-1',
            type: 'task payment',
        }

        mockedFetchChallengePaymentSummary.mockResolvedValue({
            budgetApproverHandle: 'kartik',
        })

        mockedFetchWinningPaymentDetails.mockResolvedValue({
            paymentCreatorHandle: 'chAVGA5xBDH6Gxz1JMJ67Np7CBSAtoaL@clients',
            taskDetails: {
                paymentApproverHandle: 'TonyJ',
                paymentCreatorHandle: 'wendell',
                projectId: '42',
                projectName: 'General Electric Front End Task',
                taskDescription: 'Deliver clean, production-ready HTML, CSS, and JavaScript.',
            },
        })

        render(<PaymentView payment={taskPayment} />)

        await waitFor(() => {
            expect(mockedFetchWinningPaymentDetails)
                .toHaveBeenCalledWith(taskPayment)
        })

        await waitFor(() => {
            expect(mockedFetchChallengePaymentSummary)
                .toHaveBeenCalledWith('challenge-uuid-1')
        })

        expect(screen.getByText('Task Creator'))
            .toBeTruthy()
        expect(screen.getByText('Budget Approver'))
            .toBeTruthy()
        expect(screen.getByText('Payment Approver'))
            .toBeTruthy()
        expect(screen.queryByText('Payment Creator'))
            .toBeNull()
        expect(await screen.findByText('wendell'))
            .toBeTruthy()
        expect(screen.queryByText('chAVGA5xBDH6Gxz1JMJ67Np7CBSAtoaL@clients'))
            .toBeNull()
        expect(await screen.findByText('kartik'))
            .toBeTruthy()
        expect(await screen.findByText('TonyJ'))
            .toBeTruthy()
        expect(screen.queryByText('PAYMENT MATCHES AGREEMENT'))
            .toBeNull()
        expect(await screen.findByRole('tab', { name: 'Task Details' }))
            .toBeTruthy()

        await waitFor(() => {
            expect(screen.queryByText('Loading task details...'))
                .toBeNull()
        })

        await userEvent.click(screen.getByRole('tab', { name: 'Task Details' }))

        const taskDetailsPanel = screen.getByRole('tabpanel')

        expect(within(taskDetailsPanel)
            .getByText('Task Creator'))
            .toBeTruthy()
        expect(within(taskDetailsPanel)
            .getByText('wendell'))
            .toBeTruthy()
        expect(within(taskDetailsPanel)
            .getByText('Project Name'))
            .toBeTruthy()
        expect(within(taskDetailsPanel)
            .getByText('Task Description'))
            .toBeTruthy()
        expect(within(taskDetailsPanel)
            .getByText(
                'Deliver clean, production-ready HTML, CSS, and JavaScript.',
            ))
            .toBeTruthy()
        const projectLink = within(taskDetailsPanel)
            .getByRole('link', {
                name: 'General Electric Front End Task',
            })
        expect(projectLink.getAttribute('href'))
            .toBe('https://challenges.example.com/projects/42')
    })

    it('does not show task payment approver from challenge when finance omits it', async () => {
        const taskPayment: Winning = {
            ...payment,
            description: 'Pay period test task - 1st Place',
            externalId: 'challenge-uuid-1',
            type: 'task payment',
        }

        mockedFetchChallengePaymentSummary.mockResolvedValue({
            budgetApproverHandle: 'mess',
            paymentApproverHandle: 'mess',
        })

        mockedFetchWinningPaymentDetails.mockResolvedValue({
            taskDetails: {
                paymentCreatorHandle: 'TCConnCopilot',
                projectId: '42',
                projectName: 'General Electric Front End Task',
            },
        })

        render(<PaymentView payment={taskPayment} />)

        await waitFor(() => {
            expect(mockedFetchChallengePaymentSummary)
                .toHaveBeenCalledWith('challenge-uuid-1')
        })

        const paymentApproverLabel = await screen.findByText('Payment Approver')
        const summaryPaymentApprover = paymentApproverLabel.closest('[class*="summaryItem"]')

        await waitFor(() => {
            expect(summaryPaymentApprover?.textContent)
                .not.toContain('mess')
        })
    })

    it('renders contest payment details with challenge creator and budget approver labels', async () => {
        const contestPayment: Winning = {
            ...payment,
            description: 'Test Contest Task BA - Week Ending: May 02, 2026',
            externalId: 'contest-challenge-1',
            type: 'contest payment',
        }

        mockedFetchChallengePaymentSummary.mockResolvedValue({
            budgetApproverHandle: 'kartik',
            creatorHandle: 'wendell',
        })

        render(<PaymentView payment={contestPayment} onClose={jest.fn()} />)

        await waitFor(() => {
            expect(mockedFetchChallengePaymentSummary)
                .toHaveBeenCalledWith('contest-challenge-1')
        })

        expect(mockedFetchWinningPaymentDetails)
            .not.toHaveBeenCalled()

        expect(screen.getByText('Challenge Creator'))
            .toBeTruthy()
        expect(screen.getByText('Budget Approver'))
            .toBeTruthy()
        expect(screen.queryByText('Payment Creator'))
            .toBeNull()
        expect(screen.queryByText('Payment Approver'))
            .toBeNull()
        expect(await screen.findByText('wendell'))
            .toBeTruthy()
        expect(await screen.findByText('kartik'))
            .toBeTruthy()
        expect(screen.queryByText('PAYMENT MATCHES AGREEMENT'))
            .toBeNull()
        expect(screen.queryByRole('tab', { name: 'Engagement Details' }))
            .toBeNull()

        const descriptionLink = await screen.findByRole('link', {
            name: 'Test Contest Task BA - Week Ending: May 02, 2026',
        })

        expect(descriptionLink.getAttribute('href'))
            .toBe('https://www.example.com/challenges/contest-challenge-1')

        await userEvent.click(screen.getByRole('tab', { name: 'Audit History' }))

        await waitFor(() => {
            expect(mockedFetchAuditLogs)
                .toHaveBeenCalledWith(contestPayment.id)
        })
    })

    it.each([
        ['copilot payment', 'copilot-challenge-1', 'Copilot challenge payment'],
        ['review board payment', 'review-board-1', 'Review board challenge payment'],
    ])('renders %s with challenge payment summary and tabs', async (paymentType, externalId, description) => {
        const styledPayment: Winning = {
            ...payment,
            description,
            externalId,
            type: paymentType,
        }

        mockedFetchChallengePaymentSummary.mockResolvedValue({
            budgetApproverHandle: 'kartik',
            creatorHandle: 'wendell',
        })

        render(<PaymentView payment={styledPayment} onClose={jest.fn()} />)

        await waitFor(() => {
            expect(mockedFetchChallengePaymentSummary)
                .toHaveBeenCalledWith(externalId)
        })

        expect(mockedFetchWinningPaymentDetails)
            .not.toHaveBeenCalled()

        expect(screen.getByText('Challenge Creator'))
            .toBeTruthy()
        expect(screen.getByText('Budget Approver'))
            .toBeTruthy()
        expect(await screen.findByText('wendell'))
            .toBeTruthy()
        expect(await screen.findByText('kartik'))
            .toBeTruthy()
        expect(screen.queryByRole('tab', { name: 'Task Details' }))
            .toBeNull()

        const descriptionLink = await screen.findByRole('link', { name: description })
        expect(descriptionLink.getAttribute('href'))
            .toBe(`https://www.example.com/challenges/${externalId}`)
    })

    it('renders topgear payment details with handle and payment summary only', async () => {
        const topgearPayment: Winning = {
            ...payment,
            description: 'Test Project Topgeader BA - Week Ending: May 02, 2026',
            externalId: 'topgear-challenge-1',
            type: 'topgear payment',
        }

        render(<PaymentView payment={topgearPayment} onClose={jest.fn()} />)

        expect(screen.getByText('Handle'))
            .toBeTruthy()
        expect(screen.getByText('Payment'))
            .toBeTruthy()
        expect(screen.getByText('disnadiji'))
            .toBeTruthy()
        expect(screen.queryByText('Payment Creator'))
            .toBeNull()
        expect(screen.queryByText('Challenge Creator'))
            .toBeNull()
        expect(screen.queryByText('Task Creator'))
            .toBeNull()
        expect(screen.queryByRole('tab', { name: 'Task Details' }))
            .toBeNull()
        expect(screen.getByRole('tab', { name: 'General Info' }))
            .toBeTruthy()
        expect(screen.getByRole('tab', { name: 'Audit History' }))
            .toBeTruthy()

        const descriptionLink = screen.getByRole('link', {
            name: 'Test Project Topgeader BA - Week Ending: May 02, 2026',
        })

        expect(descriptionLink.getAttribute('href'))
            .toBe('https://www.example.com/challenges/topgear-challenge-1')

        expect(mockedFetchWinningPaymentDetails)
            .not.toHaveBeenCalled()

        await userEvent.click(screen.getByRole('tab', { name: 'Audit History' }))

        await waitFor(() => {
            expect(mockedFetchAuditLogs)
                .toHaveBeenCalledWith(topgearPayment.id)
        })
    })

    it('renders taas payment details with handle and payment summary only', async () => {
        const taasPayment: Winning = {
            ...payment,
            description: 'Test Project TaaS BA - Week Ending: May 02, 2026',
            externalId: 'taas-challenge-1',
            type: 'taas payment',
        }

        render(<PaymentView payment={taasPayment} onClose={jest.fn()} />)

        expect(screen.getByText('Handle'))
            .toBeTruthy()
        expect(screen.getByText('Payment'))
            .toBeTruthy()
        expect(screen.queryByText('Payment Creator'))
            .toBeNull()
        expect(screen.getByRole('tab', { name: 'General Info' }))
            .toBeTruthy()
        expect(screen.getByRole('tab', { name: 'Audit History' }))
            .toBeTruthy()

        const descriptionLink = screen.getByRole('link', {
            name: 'Test Project TaaS BA - Week Ending: May 02, 2026',
        })

        expect(descriptionLink.getAttribute('href'))
            .toBe('https://www.example.com/challenges/taas-challenge-1')

        expect(mockedFetchWinningPaymentDetails)
            .not.toHaveBeenCalled()

        await userEvent.click(screen.getByRole('tab', { name: 'Audit History' }))

        await waitFor(() => {
            expect(mockedFetchAuditLogs)
                .toHaveBeenCalledWith(taasPayment.id)
        })
    })
})
