/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useEffect, useState } from 'react'

import { Button, IconOutline } from '~/libs/ui'

import { Winning } from '../../models/WinningDetail'

import styles from './PaymentTable.module.scss'

interface PaymentTableProps {
    payments: ReadonlyArray<Winning>;
    selectedPayments?: { [paymentId: string]: Winning };
    currentPage: number;
    numPages: number;
    onPaymentEditClick: (payment: Winning) => void;
    onPaymentViewClick: (payment: Winning) => void;
    onNextPageClick: () => void;
    onPreviousPageClick: () => void;
    onPageClick: (pageNumber: number) => void;
    canEdit: boolean;
}

const PaymentsTable: React.FC<PaymentTableProps> = (props: PaymentTableProps) => {
    const [selectedPayments, setSelectedPayments] = useState<{ [paymentId: string]: Winning }>({})

    useEffect(() => {
        if (props.selectedPayments) {
            setSelectedPayments(props.selectedPayments)
        }
    }, [props.selectedPayments])

    return (
        <>
            <div className={styles.tableContainer}>
                <table>
                    <thead>
                        <tr>
                            <th className='body-ultra-small-bold'>HANDLE</th>
                            <th className={`body-ultra-small-bold ${styles.description}`}>DESCRIPTION</th>
                            <th className='body-ultra-small-bold'>CREATE DATE</th>
                            <th className='body-ultra-small-bold'>PAYMENT</th>
                            <th className='body-ultra-small-bold'>STATUS</th>
                            <th className='body-ultra-small-bold'>RELEASE DATE</th>
                            <th className='body-ultra-small-bold'>DATE PAID</th>
                            <th className='body-ultra-small-bold' aria-label='actions'> </th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.payments.map(payment => (
                            <tr
                                key={`${payment.id}`}
                                className={selectedPayments[payment.id] ? 'selected' : ''}
                            >
                                <td className='body-small-bold'>{payment.handle}</td>
                                <td className='body-small'>{payment.description}</td>
                                <td className='body-small-bold'>{payment.createDate}</td>
                                <td className='body-small-bold'>{payment.grossAmount}</td>
                                <td className={`body-small-bold ${styles.capitalize}`}>{payment.status}</td>
                                <td>{payment.releaseDate}</td>
                                <td>{payment.datePaid}</td>
                                <td className={styles.actionButtons}>
                                    {props.canEdit && payment.status.toUpperCase() !== 'CANCELLED' && (
                                        <Button
                                            icon={IconOutline.PencilIcon}
                                            size='sm'
                                            onClick={() => props.onPaymentEditClick(payment)}
                                        />
                                    )}
                                    <Button
                                        icon={IconOutline.BookOpenIcon}
                                        size='sm'
                                        onClick={() => props.onPaymentViewClick(payment)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {props.numPages > 1 && (
                <div className={styles.paymentFooter}>
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
                </div>
            )}
        </>
    )
}

export default PaymentsTable
