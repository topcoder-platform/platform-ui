import type { ProjectBillingAccount } from '../services'

import {
    calculateMemberPaymentAmount,
    calculateMemberPaymentsRemaining,
    getBillingAccountBudgetInfo,
    getCopilotMemberPaymentsBudgetInfo,
    getProjectBillingAccountChallengeErrorMessage,
    getProjectBillingAccountChallengeIssue,
    getProjectBillingAccountEngagementPaymentErrorMessage,
    getProjectBillingAccountEngagementPaymentIssue,
    getProjectBillingAccountNoticeMessage,
} from './project-billing-account.utils'

describe('project-billing-account challenge gating helpers', () => {
    it('treats missing billing accounts as blocked only when required', () => {
        expect(getProjectBillingAccountChallengeIssue(undefined))
            .toBeUndefined()
        expect(getProjectBillingAccountChallengeIssue(undefined, true))
            .toBe('missing')
        expect(getProjectBillingAccountNoticeMessage('missing'))
            .toBe('This project does not have a billing account.')
        expect(getProjectBillingAccountChallengeErrorMessage('missing'))
            .toBe('Cannot launch challenges because this project does not have a billing account.')
    })

    it('treats inactive billing accounts as blocked for challenges', () => {
        const billingAccount: ProjectBillingAccount = {
            active: false,
            id: '80001061',
        }

        expect(getProjectBillingAccountChallengeIssue(billingAccount))
            .toBe('inactive')
        expect(getProjectBillingAccountEngagementPaymentIssue(billingAccount))
            .toBe('inactive')
        expect(getProjectBillingAccountNoticeMessage('inactive'))
            .toBe('The billing account for this project is inactive.')
        expect(getProjectBillingAccountChallengeErrorMessage('inactive'))
            .toBe('Cannot launch challenges because the project billing account is inactive.')
        expect(getProjectBillingAccountEngagementPaymentErrorMessage('inactive'))
            .toBe('Cannot create engagement payments because the project billing account is inactive.')
    })

    it('treats expired billing accounts as blocked for challenges', () => {
        const billingAccount: ProjectBillingAccount = {
            active: true,
            endDate: '2000-01-01T00:00:00.000Z',
            id: '80001061',
        }

        expect(getProjectBillingAccountChallengeIssue(billingAccount))
            .toBe('expired')
        expect(getProjectBillingAccountEngagementPaymentIssue(billingAccount))
            .toBe('expired')
        expect(getProjectBillingAccountEngagementPaymentErrorMessage('expired'))
            .toBe('Cannot create engagement payments because the project billing account is expired.')
    })

    it('treats depleted billing accounts as blocked for challenges', () => {
        const billingAccount: ProjectBillingAccount = {
            active: true,
            endDate: '2099-01-01T00:00:00.000Z',
            id: '80001061',
            status: 'ACTIVE',
            totalBudgetRemaining: 0,
        }

        expect(getProjectBillingAccountChallengeIssue(billingAccount))
            .toBe('insufficient-funds')
        expect(getProjectBillingAccountNoticeMessage('insufficient-funds'))
            .toBe('The billing account for this project has insufficient remaining funds.')
        expect(getProjectBillingAccountChallengeErrorMessage('insufficient-funds'))
            .toBe(
                'Cannot launch challenges because the project billing account has insufficient remaining funds.',
            )
    })

    it('allows active, funded billing accounts to launch challenges', () => {
        const billingAccount: ProjectBillingAccount = {
            active: true,
            endDate: '2099-01-01T00:00:00.000Z',
            id: '80001061',
            status: 'ACTIVE',
            totalBudgetRemaining: 150,
        }

        expect(getProjectBillingAccountChallengeIssue(billingAccount))
            .toBeUndefined()
    })

    it('calculates standard billing budget info from locked and consumed totals', () => {
        expect(getBillingAccountBudgetInfo({
            budget: 1000,
            consumedBudget: 225,
            lockedBudget: 125,
            totalBudgetRemaining: 650,
        }))
            .toEqual({
                spent: 350,
                status: 'healthy',
                totalBudget: 1000,
                totalBudgetRemaining: 650,
            })
    })

    it('calculates copilot member payments remaining without exposing markup', () => {
        expect(calculateMemberPaymentAmount(125.25, 0.25))
            .toBe(100.20)
        expect(calculateMemberPaymentsRemaining(250, 0.25))
            .toBe(200)
        expect(getCopilotMemberPaymentsBudgetInfo({
            budget: 1000,
            consumedBudget: 500,
            lockedBudget: 250,
            memberPaymentsRemaining: 200,
            totalBudgetRemaining: 250,
        }))
            .toEqual({
                memberPaymentsRemaining: 200,
                spent: 750,
                status: 'warning',
                totalBudget: 1000,
                totalBudgetRemaining: 250,
            })
        expect(getCopilotMemberPaymentsBudgetInfo({
            budget: 1000,
            consumedBudget: 500,
            lockedBudget: 250,
            markup: 0.25,
            totalBudgetRemaining: 250,
        }))
            .toEqual({
                memberPaymentsRemaining: 200,
                spent: 750,
                status: 'warning',
                totalBudget: 1000,
                totalBudgetRemaining: 250,
            })
    })
})
