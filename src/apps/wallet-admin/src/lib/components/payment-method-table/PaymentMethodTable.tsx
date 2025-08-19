/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React from 'react'

import { Button, IconOutline, Tooltip } from '~/libs/ui'

import { PaymentProvider } from '../../models/PaymentProvider'

import styles from './PaymentMethodTable.module.scss'

interface PaymentMethodTableProps {
    paymentMethods: ReadonlyArray<PaymentProvider>;
    currentPage: number;
    numPages: number;
    onNextPageClick: () => void;
    onPreviousPageClick: () => void;
    onPageClick: (pageNumber: number) => void;
    onDeleteClick?: (form: PaymentProvider) => void;
}

const PaymentProviderTable: React.FC<PaymentMethodTableProps> = (props: PaymentMethodTableProps) => (
    <>
        <div className={styles.tableContainer}>
            <table>
                <thead>
                    <tr>
                        <th className='body-ultra-small-bold'>HANDLE</th>
                        <th className='body-ultra-small-bold'>CONNECTED PROVIDER</th>
                        <th className='body-ultra-small-bold'>PROVIDER ID</th>
                        <th className='body-ultra-small-bold'>STATUS</th>
                        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                        <th className='body-ultra-small'> </th>
                    </tr>
                </thead>
                <tbody>
                    {props.paymentMethods.map(provider => (
                        <tr key={provider.upmId}>
                            <td className='body-small-bold'>{provider.handle}</td>
                            <td className={`body-small-bold ${styles.capitalize}`}>{provider.type}</td>
                            <td className='body-small-bold'>{provider.providerId === 'Legacy' ? provider.userId : provider.providerId}</td>
                            <td>{provider.status}</td>
                            <td className={styles.actionButtons}>
                                <Tooltip
                                    content='Remove Provider'
                                    place='top'
                                >
                                    <Button
                                        icon={IconOutline.TrashIcon}
                                        size='sm'
                                        onClick={() => props.onDeleteClick !== undefined && props.onDeleteClick(provider)}
                                    />
                                </Tooltip>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {props.numPages > 1 && (
            <div className={styles.footer}>
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

export default PaymentProviderTable
