/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type {
    AssignmentPayment,
} from '../models'
import {
    calculatePaymentChallengeFee,
    getPaymentAmount,
    getPaymentBillingAccountId,
    getPaymentBillingAccountName,
    getPaymentChallengeFee,
} from './payment.utils'

describe('payment.utils', () => {
    it('calculates payment fees from decimal or whole-number markup values', () => {
        expect(calculatePaymentChallengeFee(480, 0.15))
            .toBe(72)
        expect(calculatePaymentChallengeFee(480, 15))
            .toBe(72)
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
})
