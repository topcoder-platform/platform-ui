/* eslint-disable react/jsx-no-bind */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React from 'react'

import { Button, IconOutline } from '~/libs/ui'

import { Winning } from '../../models/WinningDetail'

import styles from './PointsTable.module.scss'

interface PointsTableProps {
    points: ReadonlyArray<Winning>
    currentPage: number
    numPages: number
    onNextPageClick: () => void
    onPreviousPageClick: () => void
    onPageClick: (pageNumber: number) => void
    onPointEditClick: (point: Winning) => void
    onPointViewClick: (point: Winning) => void
    canEdit: boolean
}

const PointsTable: React.FC<PointsTableProps> = (props: PointsTableProps) => (
    <>
        <div className={styles.tableContainer}>
            <table>
                <thead>
                    <tr>
                        <th className='body-ultra-small-bold'>HANDLE</th>
                        <th className='body-ultra-small-bold'>DESCRIPTION</th>
                        <th className='body-ultra-small-bold'>CREATE DATE</th>
                        <th className='body-ultra-small-bold'>POINTS</th>
                        <th className='body-ultra-small-bold' aria-label='actions'> </th>
                    </tr>
                </thead>
                <tbody>
                    {props.points.map(point => (
                        <tr key={point.id}>
                            <td className='body-small-bold'>{point.handle}</td>
                            <td className='body-small'>
                                <div className={styles.descriptionCell}>
                                    {point.description}
                                </div>
                            </td>
                            <td className='body-small'>{point.createDate}</td>
                            <td className='body-small'>{point.grossAmountNumber}</td>
                            <td className={styles.actionButtons}>
                                {props.canEdit && (
                                    <Button
                                        icon={IconOutline.PencilIcon}
                                        size='sm'
                                        onClick={() => props.onPointEditClick(point)}
                                    />
                                )}
                                <Button
                                    icon={IconOutline.BookOpenIcon}
                                    size='sm'
                                    onClick={() => props.onPointViewClick(point)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className={styles.paymentFooter}>
            <div className={styles.total} />
            {props.numPages > 1 && (
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
            )}
            <div />
        </div>
    </>
)

export default PointsTable
