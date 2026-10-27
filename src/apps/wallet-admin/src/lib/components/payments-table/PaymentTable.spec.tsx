/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import React from 'react'
import { render, screen } from '@testing-library/react'

import { Winning } from '../../models/WinningDetail'
import PaymentsTable from './PaymentTable'

jest.mock('~/libs/ui', () => ({
    Button: (props: any) => (
        <button type='button' disabled={props.disabled} onClick={props.onClick}>{props.label}</button>
    ),
    IconOutline: new Proxy({}, { get: () => () => <svg /> }),
    Tooltip: (props: any) => (
        <div>
            {props.children}
            <div data-testid='tooltip'>{props.content}</div>
        </div>
    ),
}), {
    virtual: true,
})

const basePayment: Winning = {
    createDate: 'Oct 20, 2026',
    currency: 'USD',
    datePaid: '-',
    description: 'Challenge prize',
    details: [],
    externalId: 'challenge-1',
    grossAmount: '$100.00',
    grossAmountNumber: 100,
    handle: 'member1',
    id: 'winning-1',
    releaseDate: 'Oct 21, 2026',
    releaseDateObj: new Date('2026-10-21T00:00:00.000Z'),
    status: 'Paid',
    totalAmount: '$100.00',
    totalAmountNumber: 100,
    type: 'contest payment',
}

const renderTable = (payments: Winning[]): ReturnType<typeof render> => render(
    <PaymentsTable
        payments={payments}
        currentPage={1}
        numPages={1}
        canEdit={false}
        onPaymentEditClick={jest.fn()}
        onPaymentViewClick={jest.fn()}
        onNextPageClick={jest.fn()}
        onPreviousPageClick={jest.fn()}
        onPageClick={jest.fn()}
    />,
)

describe('PaymentsTable double payment flag', () => {
    it('flags a payment included in several processing/processed releases', () => {
        renderTable([{
            ...basePayment,
            duplicateReleases: [{
                installmentNumber: 1,
                paymentId: 'payment-1',
                releases: [
                    {
                        amount: '100.00',
                        createdAt: '2026-10-20T10:00:00.000Z',
                        externalTransactionId: 'P-1',
                        releaseId: 'release-1',
                        status: 'PROCESSED',
                    },
                    {
                        amount: '100.00',
                        createdAt: '2026-10-20T10:00:01.000Z',
                        externalTransactionId: 'P-2',
                        releaseId: 'release-2',
                        status: 'PROCESSING',
                    },
                ],
            }],
        }])

        expect(screen.getByText('Double payment'))
            .toBeTruthy()
        expect(screen.getByText('member1')
            .closest('tr')?.className)
            .toContain('doublePaymentRow')
        expect(screen.getByText('Installment 1 is in 2 releases:'))
            .toBeTruthy()
        expect(screen.getByText(/release-1 \(processed/))
            .toBeTruthy()
        expect(screen.getByText(/release-2 \(processing/))
            .toBeTruthy()
    })

    it('does not flag payments without duplicate releases', () => {
        renderTable([{ ...basePayment, duplicateReleases: [] }, { ...basePayment, id: 'winning-2' }])

        expect(screen.queryByText('Double payment'))
            .toBeNull()
    })
})
