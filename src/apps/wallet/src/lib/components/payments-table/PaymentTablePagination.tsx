import { FC } from 'react'

import styles from './PaymentTablePagination.module.scss'
import { Button, IconOutline } from '~/libs/ui'

interface PaymentTablePaginationProps {
    currentPage: number;
    numPages: number;
    onNextPageClick: () => void;
    onPreviousPageClick: () => void;
    onPageClick: (pageNumber: number) => void;
}

const PaymentTablePagination: FC<PaymentTablePaginationProps> = props => {

    if (props.numPages <= 1) {
        return <></>
    }
    
    return  (
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
    )
}

export default PaymentTablePagination
