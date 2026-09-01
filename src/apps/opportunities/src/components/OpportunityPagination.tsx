/* eslint-disable no-confusing-arrow, ordered-imports/ordered-imports, react/jsx-no-bind, react/no-array-index-key */
import { ChangeEvent, FC } from 'react'

import { ReactComponent as ChevronDownIcon } from '../assets/chevron-down.svg'
import { ReactComponent as PaginationChevronIcon } from '../assets/pagination-chevron-right.svg'
import styles from './OpportunityPagination.module.scss'

interface OpportunityPaginationProps {
    onPageChange: (page: number) => void
    onPerPageChange: (perPage: number) => void
    page: number
    perPage: number
    total: number
    totalPages: number
}

/**
 * Calculates the compact page-number window used above and below results.
 *
 * @param page active page.
 * @param totalPages total available pages.
 * @returns page numbers and a zero sentinel for ellipses.
 * @throws Does not throw.
 */
export function paginationWindow(page: number, totalPages: number): number[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
    if (page <= 4) return [1, 2, 3, 4, 5, 0, totalPages]
    if (page >= totalPages - 3) {
        return [1, 0, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, 0, page - 1, page, page + 1, 0, totalPages]
}

/**
 * Renders list page-size, range, and navigation controls.
 *
 * @param props current pagination metadata and change callbacks.
 * @returns accessible pagination controls.
 * @throws Does not throw.
 */
export const OpportunityPagination: FC<OpportunityPaginationProps> = props => {
    const start = props.total === 0 ? 0 : ((props.page - 1) * props.perPage) + 1
    const end = Math.min(props.total, props.page * props.perPage)
    const pages = paginationWindow(props.page, props.totalPages)

    /** Applies a selected page size. */
    const handlePerPage = (event: ChangeEvent<HTMLSelectElement>): void => {
        props.onPerPageChange(Number(event.target.value))
    }

    return (
        <div className={styles.pagination}>
            <div className={styles.summary}>
                <label>
                    Items per page:
                    <span className={styles.perPageSelect}>
                        <select onChange={handlePerPage} value={props.perPage}>
                            {[10, 20, 50].map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                        <ChevronDownIcon aria-hidden='true' />
                    </span>
                </label>
                <span aria-hidden='true' className={styles.divider} />
                <span className={styles.range}>{`${start} - ${end} of ${props.total} items`}</span>
            </div>
            <nav aria-label='Results pages'>
                <button
                    aria-label='Previous page'
                    disabled={props.page <= 1}
                    onClick={() => props.onPageChange(props.page - 1)}
                    type='button'
                >
                    <PaginationChevronIcon aria-hidden='true' />
                </button>
                {pages.map((page, index) => page === 0
                    ? <span className={styles.ellipsis} key={`gap-${index}`}>…</span>
                    : (
                        <button
                            aria-current={page === props.page ? 'page' : undefined}
                            className={page === props.page ? styles.active : undefined}
                            key={page}
                            onClick={() => props.onPageChange(page)}
                            type='button'
                        >
                            {page}
                        </button>
                    ))}
                <button
                    aria-label='Next page'
                    disabled={props.totalPages === 0 || props.page >= props.totalPages}
                    onClick={() => props.onPageChange(props.page + 1)}
                    type='button'
                >
                    <PaginationChevronIcon aria-hidden='true' />
                </button>
            </nav>
        </div>
    )
}
