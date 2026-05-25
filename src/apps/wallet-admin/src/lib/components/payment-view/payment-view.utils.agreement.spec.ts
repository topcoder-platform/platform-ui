import { Winning } from '../../models/WinningDetail'

import {
    buildEngagementAgreementSummary,
    formatAgreementBreakdown,
    formatAgreementExpectedAmount,
} from './payment-view.utils'

const basePayment: Winning = {
    createDate: '01/01/2026',
    currency: 'USD',
    datePaid: '-',
    description: 'Engagement payment',
    details: [],
    externalId: 'assignment-1',
    grossAmount: '$0.00',
    grossAmountNumber: 0,
    handle: 'member',
    id: 'winning-1',
    releaseDate: '01/01/2026',
    releaseDateObj: new Date('2026-01-01T00:00:00.000Z'),
    status: 'Owed',
    type: 'engagement payment',
}

describe('buildEngagementAgreementSummary', () => {
    it('matches weekly expected amount', () => {
        const summary = buildEngagementAgreementSummary(
            { ...basePayment, grossAmountNumber: 2000 },
            {
                paymentCycle: 'weekly',
                ratePerHour: '50',
                standardHoursPerDay: 8,
            },
        )

        expect(summary?.status)
            .toBe('match')
        expect(summary?.expectedAmount)
            .toBe(2000)
        expect(summary?.expectedAmountMax)
            .toBeUndefined()
        expect(formatAgreementBreakdown(summary!))
            .toBe('US$50.00 x 8 hours x 5 days')
    })

    it('flags fortnightly payments below expected amount', () => {
        const summary = buildEngagementAgreementSummary(
            { ...basePayment, grossAmountNumber: 3000 },
            {
                paymentCycle: 'fortnightly',
                ratePerHour: '50',
                standardHoursPerDay: 8,
            },
        )

        expect(summary?.status)
            .toBe('under')
        expect(summary?.expectedAmount)
            .toBe(4000)
    })

    it('flags fortnightly payments above expected amount', () => {
        const summary = buildEngagementAgreementSummary(
            { ...basePayment, grossAmountNumber: 5000 },
            {
                paymentCycle: 'fortnightly',
                ratePerHour: '50',
                standardHoursPerDay: 8,
            },
        )

        expect(summary?.status)
            .toBe('over')
    })

    it('matches monthly payments inside the expected range', () => {
        const summary = buildEngagementAgreementSummary(
            { ...basePayment, grossAmountNumber: 8500 },
            {
                paymentCycle: 'monthly',
                ratePerHour: '50',
                standardHoursPerDay: 8,
            },
        )

        expect(summary?.status)
            .toBe('match')
        expect(summary?.expectedAmount)
            .toBe(8000)
        expect(summary?.expectedAmountMax)
            .toBe(9200)
        expect(formatAgreementExpectedAmount(summary!))
            .toBe('US$8,000.00 - US$9,200.00')
        expect(formatAgreementBreakdown(summary!))
            .toBe(
                'US$50.00 x 8 hours x 20 days - US$50.00 x 8 hours x 23 days',
            )
    })

    it('flags monthly payments below the expected range', () => {
        const summary = buildEngagementAgreementSummary(
            { ...basePayment, grossAmountNumber: 7500 },
            {
                paymentCycle: 'monthly',
                ratePerHour: '50',
                standardHoursPerDay: 8,
            },
        )

        expect(summary?.status)
            .toBe('under')
        expect(summary?.differenceAmount)
            .toBe(500)
    })

    it('flags monthly payments above the expected range', () => {
        const summary = buildEngagementAgreementSummary(
            { ...basePayment, grossAmountNumber: 9500 },
            {
                paymentCycle: 'monthly',
                ratePerHour: '50',
                standardHoursPerDay: 8,
            },
        )

        expect(summary?.status)
            .toBe('over')
        expect(summary?.differenceAmount)
            .toBe(300)
    })
})
