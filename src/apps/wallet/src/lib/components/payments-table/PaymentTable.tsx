/* eslint-disable react/jsx-no-bind */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useEffect, useState } from 'react'

import { Button, IconOutline, PageDivider } from '~/libs/ui'

import { Winning } from '../../models/WinningDetail'

import styles from './PaymentTable.module.scss'

interface PaymentTableProps {
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

    const isSomeSelected = Object.keys(selectedPayments).length > 0

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
        const newSelections: { [paymentId: string]: Winning } = {}
        if (!toggleClicked && !isSomeSelected) {
            props.payments.forEach(payment => {
                if (payment.canBeReleased) {
                    newSelections[payment.id] = payment
                }
            })
        }

        setToggleClicked(!toggleClicked)
        setSelectedPayments(newSelections)
        props.onSelectedPaymentsChange?.(newSelections)
    }

    const calculateTotal = () => Object.values(selectedPayments)
        .reduce((acc, payment) => acc + parseFloat(payment.netPayment.replace(/[^0-9.-]+/g, '')), 0)

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

            {props.numPages > 1 && (
                <>
                    <PageDivider />
                    <div className={styles.pageButtons}>
                        <Button
                            onClick={props.onPreviousPageClick}
                            secondary
                            size='md'
                            icon={IconOutline.ChevronLeftIcon}
                            iconToLeft
                            label='PREVIOUS'
                            disabled={props.currentPage === 1}
                        />
                        {props.currentPage > 3 && <span>...</span>}
                        <div className={styles.pageNumbers}>
                            {Array.from(Array(props.numPages)
                                .keys())
                                .filter(pageNumber => {
                                    const currentPage = props.currentPage - 1
                                    const maxPagesToShow = 5
                                    const halfMaxPagesToShow = Math.floor(maxPagesToShow / 2)
                                    const startPage = Math.max(currentPage - halfMaxPagesToShow, 0)
                                    const endPage = Math.min(startPage + maxPagesToShow - 1, props.numPages - 1)

                                    return pageNumber >= startPage && pageNumber <= endPage
                                })
                                .map(pageNumber => (
                                    <Button
                                        key={`page-${pageNumber}`}
                                        secondary
                                        variant='round'
                                        label={`${pageNumber + 1}`}
                                        onClick={() => props.onPageClick(pageNumber + 1)}
                                        disabled={pageNumber === props.currentPage - 1}
                                    />
                                ))}
                        </div>
                        {props.currentPage < props.numPages - 2 && <span>...</span>}
                        <Button
                            onClick={props.onNextPageClick}
                            secondary
                            size='md'
                            icon={IconOutline.ChevronRightIcon}
                            iconToRight
                            label='NEXT'
                            disabled={props.currentPage === props.numPages}
                        />
                    </div>
                </>
            )}

            <div className={styles.paymentFooter}>
                <div className={styles.total}>
                    Total: $
                    {total.toFixed(2)}
                </div>
                <Button
                    primary
                    onClick={() => {
                        props.onPayMeClick(selectedPayments, total.toFixed(2))
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
