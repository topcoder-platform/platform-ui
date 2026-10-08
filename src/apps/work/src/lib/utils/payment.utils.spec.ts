/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type {
    AssignmentPayment,
} from '../models'
import {
    calculateAssignmentHoursLeft,
    calculatePaymentChallengeFee,
    getAssignmentTotalHours,
    sumProcessedPaymentHours,
    getPaymentAmount,
    getPaymentBillingAccountId,
    getPaymentBillingAccountName,
    getPaymentChallengeFee,
} from './payment.utils'

describe('payment.utils', () => {
    it('calculates payment fees from billing-account markup multipliers', () => {
        expect(calculatePaymentChallengeFee(480, 0.15))
            .toBe(72)
        expect(calculatePaymentChallengeFee(570, 1.2259))
            .toBe(698.76)
    })

    it('reads the persisted payment challenge fee when finance returns it explicitly', () => {
        const payment: AssignmentPayment = {
            details: [
                {
                    challengeFee: 72,
                    grossAmount: 480,
                    totalAmount: 480,
                },
            ],
        }

        expect(getPaymentChallengeFee(payment))
            .toBe(72)
    })

    it('reads top-level payment split fields from report-shaped payloads', () => {
        const payment: AssignmentPayment = {
            billingAccountId: '80004466',
            challengeFee: '420.66',
            paymentAmount: '342.00',
        }

        expect(getPaymentAmount(payment))
            .toBe(342)
        expect(getPaymentChallengeFee(payment))
            .toBe(420.66)
        expect(getPaymentBillingAccountId(payment))
            .toBe('80004466')
    })

    it('prefers explicit paymentAmount over generic amount when both are present', () => {
        const payment: AssignmentPayment = {
            amount: 762.66,
            paymentAmount: '342.00',
        }

        expect(getPaymentAmount(payment))
            .toBe(342)
    })

    it('falls back to the total-versus-gross delta for older payment payloads', () => {
        const payment: AssignmentPayment = {
            details: [
                {
                    grossAmount: 480,
                    totalAmount: 552,
                },
            ],
        }

        expect(getPaymentChallengeFee(payment))
            .toBe(72)
    })

    it('reads billing account details from the first payment detail', () => {
        const payment: AssignmentPayment = {
            details: [
                {
                    billingAccount: 80001063,
                    billingAccountName: 'BA For Marios',
                    grossAmount: 480,
                    totalAmount: 480,
                },
            ],
        }

        expect(getPaymentBillingAccountId(payment))
            .toBe('80001063')
        expect(getPaymentBillingAccountName(payment))
            .toBe('BA For Marios')
    })

    describe('hours left', () => {
        const payment = (hoursWorked: number, status?: string): AssignmentPayment => ({
            attributes: { hoursWorked },
            details: [{ status }],
        })

        it('counts paid, processing, owed, and on-hold payments as processed', () => {
            expect(sumProcessedPaymentHours([
                payment(40, 'PAID'),
                payment(8.5, 'PROCESSING'),
                payment(10, 'OWED'),
                payment(2, 'ON_HOLD_ADMIN'),
            ]))
                .toBe(60.5)
        })

        it('leaves out cancelled, failed, returned, and credited payments', () => {
            expect(sumProcessedPaymentHours([
                payment(40, 'PAID'),
                payment(8, 'CANCELLED'),
                payment(8, 'FAILED'),
                payment(8, 'RETURNED'),
                payment(8, 'CREDITED'),
            ]))
                .toBe(40)
        })

        it('falls back to the payment status when there are no installment details', () => {
            expect(sumProcessedPaymentHours([
                { hoursWorked: 5, status: 'PAID' },
                { hoursWorked: 5, status: 'CANCELLED' },
            ]))
                .toBe(5)
        })

        it('is total hours minus processed hours', () => {
            expect(calculateAssignmentHoursLeft({ totalHours: '480' }, 60.5))
                .toBe(419.5)
        })

        it('can go negative when more was paid than allocated', () => {
            expect(calculateAssignmentHoursLeft({ totalHours: 40 }, 48))
                .toBe(-8)
        })

        it('is blank without total hours', () => {
            expect(calculateAssignmentHoursLeft({}, 40))
                .toBeUndefined()
            expect(getAssignmentTotalHours({ totalHours: '' }))
                .toBeUndefined()
        })
    })
})
