import { ChangeEvent, FC } from 'react'

import { Pagination as BasePagination } from '~/apps/admin/src/lib'

import {
    PAGINATION_PER_PAGE_OPTIONS,
} from '../../constants'

import styles from './Pagination.module.scss'

interface PaginationProps {
    page: number
    perPage: number
    total: number
    itemLabel?: string
    onPageChange: (page: number) => void
    onPerPageChange: (perPage: number) => void
}

export const Pagination: FC<PaginationProps> = (props: PaginationProps) => {
    const itemLabel: string = props.itemLabel || 'challenges'
    const onPageChange: (page: number) => void = props.onPageChange
    const onPerPageChange: (perPage: number) => void = props.onPerPageChange
    const page: number = props.page
    const perPage: number = props.perPage
    const total: number = props.total

    const totalPages = Math.max(1, Math.ceil(total / perPage) || 1)
    const start = total === 0
        ? 0
        : ((page - 1) * perPage) + 1
    const end = Math.min(page * perPage, total)

    function handlePerPageChange(event: ChangeEvent<HTMLSelectElement>): void {
        onPerPageChange(Number(event.target.value))
    }

    return (
        <div className={styles.container}>
            <div className={styles.perPageBlock}>
                <label htmlFor='work-challenges-per-page'>Rows per page</label>
                <select
                    id='work-challenges-per-page'
                    value={perPage}
                    onChange={handlePerPageChange}
                >
                    {PAGINATION_PER_PAGE_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>

            <div className={styles.metaText}>
                Showing
                {' '}
                {start}
                -
                {end}
                {' '}
                of
                {' '}
                {total}
                {' '}
                {itemLabel}
            </div>

            <BasePagination
                page={page}
                totalPages={totalPages}
                onPageChange={onPageChange}
            />
        </div>
    )
}

export default Pagination
