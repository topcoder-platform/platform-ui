/* eslint-disable react/jsx-no-bind */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useEffect, useState } from 'react'

import { Button, Tooltip } from '~/libs/ui'

import { Winning } from '../../models/WinningDetail'

import PaymentTablePagination from './PaymentTablePagination'
import styles from './PaymentTable.module.scss'

interface PaymentTableProps {
    minWithdrawAmount: number;
    payments: ReadonlyArray<Winning>;
    selectedPayments?: { [paymentId: string]: Winning };
    currentPage: number;
    numPages: number;
    onPayMeClick: (paymentIds: { [paymentId: string]: Winning }, totalAmount: string) => void;
    onSelectedPaymentsChange?: (paymentIds: { [paymentId: string]: Winning }) => void;
    onNextPageClick: () => void;
    onPreviousPageClick: () => void;
    onPageClick: (pageNumber: number) => void;
}

const PaymentsTable: React.FC<PaymentTableProps> = (props: PaymentTableProps) => {
    const [selectedPayments, setSelectedPayments] = useState<{ [paymentId: string]: Winning }>({})
    const [toggleClicked, setToggleClicked] = useState(false)

    useEffect(() => {
        if (props.selectedPayments) {
            setSelectedPayments(props.selectedPayments)
        }
    }, [props.selectedPayments])

    useEffect(() => {
        setToggleClicked(false)
    }, [props.currentPage])

    useEffect(() => {
        const selectablePayments = props.payments.filter(payment => payment.canBeReleased)

        if (selectablePayments.length === 0) {
            setToggleClicked(false)
        } else {
            const areAllSelectablePaymentsSelected = selectablePayments.every(payment => selectedPayments[payment.id])
            setToggleClicked(areAllSelectablePaymentsSelected)
        }
    }, [props.payments, selectedPayments])

    const togglePaymentSelection = (paymentId: string) => {
        const newSelections = { ...selectedPayments }
        if (newSelections[paymentId]) {
            delete newSelections[paymentId]
        } else {
            const payment = props.payments.find(p => p.id === paymentId)
            if (payment) {
                newSelections[paymentId] = payment
            }
        }

        setSelectedPayments(newSelections)
        props.onSelectedPaymentsChange?.(newSelections)
    }

    const toggleAllPayments = () => {
        const newSelections = { ...selectedPayments }
        const selectablePayments = props.payments.filter(payment => payment.canBeReleased)
        const areAllSelectablePaymentsSelected = selectablePayments.every(payment => selectedPayments[payment.id])

        if (areAllSelectablePaymentsSelected) {
            selectablePayments.forEach(payment => {
                delete newSelections[payment.id]
            })
        } else {
            selectablePayments.forEach(payment => {
                newSelections[payment.id] = payment
            })
        }

        setSelectedPayments(newSelections)
        props.onSelectedPaymentsChange?.(newSelections)
        setToggleClicked(!areAllSelectablePaymentsSelected)
    }

    const calculateTotal = () => Object.values(selectedPayments)
        .reduce((acc, payment) => acc + parseFloat(payment.grossPayment.replace(/[^0-9.-]+/g, '')), 0)

    const total = calculateTotal()

    const isPaymeDisabled = !total || total < props.minWithdrawAmount

    return (
        <>
            <div className={styles.tableContainer}>
                <table>
                    <thead>
                        <tr>
                            <th className='body-ultra-small-bold'>DESCRIPTION</th>
                            <th className='body-ultra-small-bold'>TYPE</th>
                            <th className='body-ultra-small-bold'>CREATE DATE</th>
                            <th className='body-ultra-small-bold'>PAYMENT</th>
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
                                <td className='body-small-bold'>{payment.grossPayment}</td>
                                <td className={`body-small-bold ${styles.capitalize}`}>{payment.status}</td>
                                <td>{payment.releaseDate}</td>
                                <td>{payment.datePaid}</td>
                                <td>
                                    <input
                                        type='checkbox'
                                        disabled={payment.status !== 'Available' || !payment.canBeReleased}
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
                <PaymentTablePagination
                    currentPage={props.currentPage}
                    numPages={props.numPages}
                    onNextPageClick={props.onNextPageClick}
                    onPreviousPageClick={props.onPreviousPageClick}
                    onPageClick={props.onPageClick}
                />
                <Tooltip
                    content={(
                        <>
                            Minimum withdrawal amounti is $
                            {props.minWithdrawAmount}
                            .
                            <br />
                            Please select more payments.
                        </>
                    )}
                    disableTooltip={!isPaymeDisabled}
                >
                    <Button
                        primary
                        onClick={() => {
                            if (isPaymeDisabled) {
                                return
                            }

                            props.onPayMeClick(selectedPayments, total.toFixed(2))
                        }}
                        className={styles.paymeBtn}
                        disabled={isPaymeDisabled}
                    >
                        PAY ME
                    </Button>
                </Tooltip>
            </div>
        </>
    )
}

export default PaymentsTable
