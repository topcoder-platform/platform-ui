/* eslint-disable react/jsx-no-bind */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React from 'react'

import { IconOutline } from '~/libs/ui'

import styles from './PointsTable.module.scss'

interface PointItem {
    id: string
    description: string
    createDate: string
    points: number
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
    const renderPaginationButtons = () => {
        const buttons = []
        const maxButtons = 7
        let startPage = Math.max(1, props.currentPage - 3)
        const endPage = Math.min(props.numPages, startPage + maxButtons - 1)

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1)
        }

        for (let i = startPage; i <= endPage; i += 1) {
            buttons.push(
                <button
                    key={i}
                    type='button'
                    className={`${styles.paginationButton} ${i === props.currentPage ? styles.active : ''}`}
                    onClick={() => props.onPageClick(i)}
                >
                    {i}
                </button>,
            )
        }

        return buttons
    }

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
                                <td className='body-small'>{point.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.paginationContainer}>
                <div className={styles.totalContainer}>
                    <span className='body-small'>
                        Total:
                        {props.points.length}
                    </span>
                </div>
                <div className={styles.pagination}>
                    <button
                        type='button'
                        className={styles.paginationButton}
                        onClick={props.onPreviousPageClick}
                        disabled={props.currentPage === 1}
                    >
                        <IconOutline.ChevronLeftIcon height={16} width={16} />
                    </button>
                    {renderPaginationButtons()}
                    <button
                        type='button'
                        className={styles.paginationButton}
                        onClick={props.onNextPageClick}
                        disabled={props.currentPage === props.numPages}
                    >
                        <IconOutline.ChevronRightIcon height={16} width={16} />
                    </button>
                </div>
            </div>
        </>
    )
}

export default PointsTable
