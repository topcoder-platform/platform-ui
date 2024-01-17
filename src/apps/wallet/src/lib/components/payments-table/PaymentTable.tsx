/* eslint-disable react/jsx-no-bind */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useState } from 'react'

import { Button } from '~/libs/ui'

import { Winning } from '../../models/WinningDetail'

import styles from './PaymentTable.module.scss'

const mapCurrency = (currency: string): string => {
    switch (currency) {
        case 'USD':
            return '$'
        case 'GBP':
            return '£'
        case 'EUR':
            return '€'
        default:
            return currency
    }
}

interface PaymentTableProps {
    payments: ReadonlyArray<Winning>
    onPayMeClick: (paymentIds: { [paymentId: string]: boolean }) => void
}
const PaymentsTable: React.FC<PaymentTableProps> = (props: PaymentTableProps) => {
    const [selectedPayments, setSelectedPayments] = useState<{ [paymentId: string]: boolean }>({})

    const togglePaymentSelection = (paymentId: string) => {
        setSelectedPayments(prevSelected => ({
            ...prevSelected,
            [paymentId]: !prevSelected[paymentId],
        }))
    }

    const isAllSelected = props.payments.length > 0 && props.payments.every(payment => selectedPayments[payment.id])

    const toggleAllPayments = () => {
        if (isAllSelected) {
            setSelectedPayments({})
        } else {
            const newSelections: { [paymentId: string]: boolean } = {}
            props.payments.forEach(payment => {
                newSelections[payment.id] = true
            })
            setSelectedPayments(newSelections)
        }
    }

    const calculateTotal = () => props.payments.reduce((acc: number, payment: Winning) => {
        if (selectedPayments[payment.id]) {
            return acc + parseFloat(payment.netPayment.replace(/[^0-9.-]+/g, ''))
        }

        return acc
    }, 0)

    const total = calculateTotal()

    return (
        <>
            <div className={styles.tableContainer}>
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Type</th>
                            <th>Create Date</th>
                            <th>Net Payment</th>
                            <th>Status</th>
                            <th>Release Date</th>
                            <th>Date Paid</th>
                            <th>
                                <input
                                    type='checkbox'
                                    onChange={toggleAllPayments}
                                    disabled={props.payments.find(payment => payment.status !== 'OWED') === undefined}
                                    checked={isAllSelected}
                                    aria-label='Select all payments'
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.payments.map(payment => (
                            <tr
                                key={`${payment.id}`}
                                className={selectedPayments[payment.id] ? 'selected' : ''}
                            >
                                <td className='body-main'>{payment.description}</td>
                                <td className='body-main-bold'>{payment.type}</td>
                                <td className='body-main-bold'>{payment.createDate}</td>
                                <td className='body-main-bold'>{`${payment.netPayment} ${mapCurrency(payment.currency)}`}</td>
                                <td className='body-main-normal'>{payment.status}</td>
                                <td>{payment.releaseDate}</td>
                                <td>{payment.datePaid}</td>
                                <td>
                                    <input
                                        type='checkbox'
                                        disabled={payment.status !== 'OWED' || !payment.canBeReleased}
                                        checked={!!selectedPayments[payment.id]}
                                        onChange={() => togglePaymentSelection(payment.id)}
                                        aria-label={`Select payment ${payment.id}`}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={styles.paymentFooter}>
                <div className={styles.total}>
                    Total: $
                    {total.toFixed(2)}
                </div>
                <Button
                    primary
                    onClick={() => {
                        props.onPayMeClick(selectedPayments)
                    }}
                    disabled={total === 0}
                >
                    PAY ME
                </Button>
            </div>
        </>
    )
}

export default PaymentsTable
