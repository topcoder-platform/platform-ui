import React, { FC, useEffect, useState } from 'react'

import { Button, IconOutline } from '~/libs/ui'
import styles from './Pagination.module.scss'

interface PaginationProps {
  currentPage: number
  numPages: number
  onNextPageClick: () => void
  onPreviousPageClick: () => void
  onPageClick: (pageNumber: number) => void
}

const Pagination: FC<PaginationProps> = ({
    currentPage,
    numPages,
    onNextPageClick,
    onPreviousPageClick,
    onPageClick,
}) => {
    return (
        <div className={styles.pageButtons}>
            <Button
                onClick={onPreviousPageClick}
                secondary
                size='md'
                icon={IconOutline.ChevronLeftIcon}
                iconToLeft
                label='PREVIOUS'
                disabled={currentPage === 1}
            />
            {currentPage > 3 && <span>...</span>}
            <div className={styles.pageNumbers}>
                {Array.from(Array(numPages)
                    .keys())
                    .filter(pageNumber => {
                        const currentPage_ = currentPage - 1
                        const maxPagesToShow = 5
                        const halfMaxPagesToShow = Math.floor(maxPagesToShow / 2)
                        const startPage = Math.max(currentPage_ - halfMaxPagesToShow, 0)
                        const endPage = Math.min(startPage + maxPagesToShow - 1, numPages - 1)

                        return pageNumber >= startPage && pageNumber <= endPage
                    })
                    .map(pageNumber => (
                        <Button
                            key={`page-${pageNumber}`}
                            secondary
                            variant='round'
                            label={`${pageNumber + 1}`}
                            onClick={() => onPageClick(pageNumber + 1)}
                            disabled={pageNumber === currentPage - 1}
                        />
                    ))}
            </div>
            {currentPage < numPages - 2 && <span>...</span>}
            <Button
                onClick={onNextPageClick}
                secondary
                size='md'
                icon={IconOutline.ChevronRightIcon}
                iconToRight
                label='NEXT'
                disabled={currentPage === numPages}
            />
        </div>
    )
}

export default Pagination
