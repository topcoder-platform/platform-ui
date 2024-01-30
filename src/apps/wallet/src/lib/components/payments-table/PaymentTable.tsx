/* eslint-disable react/jsx-no-bind */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useState } from 'react'

import { Button } from '~/libs/ui'

import { Winning } from '../../models/WinningDetail'

import styles from './PaymentTable.module.scss'

interface PaymentTableProps {
    payments: ReadonlyArray<Winning>
    onPayMeClick: (paymentIds: { [paymentId: string]: boolean }) => void
}
const PaymentsTable: React.FC<PaymentTableProps> = (props: PaymentTableProps) => {
    const [selectedPayments, setSelectedPayments] = useState<{ [paymentId: string]: boolean }>({})
    const [toggleClicked, setToggleClicked] = useState(false)

    const togglePaymentSelection = (paymentId: string) => {
        setSelectedPayments(prevSelected => ({
            ...prevSelected,
            [paymentId]: !prevSelected[paymentId],
        }))
    }

    const isSomeSelected = Object.values(selectedPayments)
        .some(selected => selected)

    const toggleAllPayments = () => {
        setToggleClicked(!toggleClicked)

        if (isSomeSelected) {
            setSelectedPayments({})
        } else {
            const newSelections: { [paymentId: string]: boolean } = {}
            props.payments.forEach(payment => {
                if (payment.canBeReleased) {
                    newSelections[payment.id] = true
                }
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
                            <th className='body-ultra-small-bold'>DESCRIPTION</th>
                            <th className='body-ultra-small-bold'>TYPE</th>
                            <th className='body-ultra-small-bold'>CREATE DATE</th>
                            <th className='body-ultra-small-bold'>NET PAYMENT</th>
                            <th className='body-ultra-small-bold'>STATUS</th>
                            <th className='body-ultra-small-bold'>RELEASE DATE</th>
                            <th className='body-ultra-small-bold'>DATE PAID</th>
                            <th className='body-ultra-small-bold'>
                                <input
                                    type='checkbox'
                                    onChange={toggleAllPayments}
                                    disabled={props.payments.find(payment => payment.canBeReleased) === undefined}
                                    checked={toggleClicked}
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
                                <td className='body-small'>{payment.description}</td>
                                <td className={`body-small-bold ${styles.capitalize}`}>{payment.type}</td>
                                <td className='body-small-bold'>{payment.createDate}</td>
                                <td className='body-small-bold'>{payment.netPayment}</td>
                                <td className={`body-small-bold ${styles.capitalize}`}>{payment.status}</td>
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
