/* eslint-disable react/jsx-no-bind */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useMemo } from 'react'

import PaymentTablePagination from '../payments-table/PaymentTablePagination'

import styles from './PointsTable.module.scss'

interface PointItem {
    amount: number
    id: string
    description: string
    createDate: string
}

interface PointsTableProps {
    points: ReadonlyArray<PointItem>
    currentPage: number
    numPages: number
    onNextPageClick: () => void
    onPreviousPageClick: () => void
    onPageClick: (pageNumber: number) => void
}

const PointsTable: React.FC<PointsTableProps> = (props: PointsTableProps) => {
    const pointsTotal = useMemo(() => props.points.reduce((sum, p) => sum + p.amount, 0), [props.points])

    return (
        <>
            <div className={styles.tableContainer}>
                <table>
                    <thead>
                        <tr>
                            <th className='body-ultra-small-bold'>DESCRIPTION</th>
                            <th className='body-ultra-small-bold'>CREATE DATE</th>
                            <th className='body-ultra-small-bold'>POINTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.points.map(point => (
                            <tr key={point.id}>
                                <td className='body-small'>
                                    <div className={styles.descriptionCell}>
                                        {point.description}
                                    </div>
                                </td>
                                <td className='body-small'>{point.createDate}</td>
                                <td className='body-small'>{point.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.paymentFooter}>
                <div className={styles.total}>
                    Total:
                    {' '}
                    {pointsTotal}
                </div>
                <PaymentTablePagination
                    currentPage={props.currentPage}
                    numPages={props.numPages}
                    onNextPageClick={props.onNextPageClick}
                    onPreviousPageClick={props.onPreviousPageClick}
                    onPageClick={props.onPageClick}
                />
                <div />
            </div>
        </>
    )
}

export default PointsTable
