/* eslint-disable no-confusing-arrow, ordered-imports/ordered-imports, react/jsx-no-bind, react/no-array-index-key */
import { ChangeEvent, FC } from 'react'
import { IconOutline } from '~/libs/ui'

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
    const values = new Set([1, totalPages, page - 1, page, page + 1])
    const sorted = Array.from(values)
        .filter(value => value > 0 && value <= totalPages)
        .sort((a, b) => a - b)
    return sorted.reduce<number[]>((result, value, index) => {
        if (index > 0 && value - sorted[index - 1] > 1) result.push(0)
        result.push(value)
        return result
    }, [])
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
            <label>
                Items per page:
                <select onChange={handlePerPage} value={props.perPage}>
                    {[10, 20, 50].map(value => <option key={value} value={value}>{value}</option>)}
                </select>
            </label>
            <span>{`${start} - ${end} of ${props.total} items`}</span>
            <nav aria-label='Results pages'>
                <button
                    aria-label='Previous page'
                    disabled={props.page <= 1}
                    onClick={() => props.onPageChange(props.page - 1)}
                    type='button'
                >
                    <IconOutline.ChevronLeftIcon />
                </button>
                {pages.map((page, index) => page === 0
                    ? <span key={`gap-${index}`}>…</span>
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
                    <IconOutline.ChevronRightIcon />
                </button>
            </nav>
        </div>
    )
}
