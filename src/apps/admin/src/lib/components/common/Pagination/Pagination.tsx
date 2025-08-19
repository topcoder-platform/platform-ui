import { FC, useEffect, useMemo, useState } from 'react'

import { useWindowSize, WindowSize } from '~/libs/shared'
import { Button, IconOutline } from '~/libs/ui'

import { useEventCallback } from '../../../hooks'

import styles from './Pagination.module.scss'

interface PaginationProps {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
    disabled?: boolean
}

const Pagination: FC<PaginationProps> = (props: PaginationProps) => {
    const totalPages = props.totalPages || 1
    const MAX_PAGE_DISPLAY = 5
    const MAX_PAGE_MOBILE_DISPLAY = 3
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isMobile = useMemo(() => screenWidth < 767, [screenWidth])

    const [displayPages, setDisplayPages] = useState<number[]>([])

    useEffect(() => {
        let pages: number[] = []
        if (props.page) {
            pages = [props.page]
            const maxDisplayPage = isMobile
                ? MAX_PAGE_MOBILE_DISPLAY
                : MAX_PAGE_DISPLAY
            let haveAvailablePage = true
            let i = 1
            while (haveAvailablePage && pages.length < maxDisplayPage) {
                const prevPage = props.page - i
                haveAvailablePage = false
                if (prevPage > 0) {
                    pages = [prevPage, ...pages]
                    haveAvailablePage = true
                }

                const nextPage = props.page + i
                if (nextPage <= totalPages) {
                    pages = [...pages, nextPage]
                    haveAvailablePage = true
                }

                i += 1
            }
        }

        setDisplayPages(pages)
    }, [totalPages, props.page, isMobile]) // eslint-disable-line react-hooks/exhaustive-deps

    const createHandlePageClick = (p: number) => () => {
        if (p === 0 || p > totalPages || p === props.page) {
            return
        }

        props.onPageChange(p)
    }

    const handleFirstClick = useEventCallback(() => props.onPageChange(1))
    const handlePreviousClick = useEventCallback(() => props.onPageChange(props.page - 1))
    const handleNextClick = useEventCallback(() => props.onPageChange(props.page + 1))
    const handleLastClick = useEventCallback(() => props.onPageChange(totalPages))

    return (
        <div className={styles.pageButtons}>
            <Button
                onClick={handleFirstClick}
                secondary
                size='md'
                icon={IconOutline.ChevronDoubleLeftIcon}
                iconToLeft
                disabled={props.page === 1 || props.disabled}
                className={styles.first}
            />
            <Button
                onClick={handlePreviousClick}
                secondary
                size='md'
                icon={IconOutline.ChevronLeftIcon}
                iconToLeft
                disabled={props.page === 1 || props.disabled}
                className={styles.previous}
            />
            <div className={styles.pageNumbers}>
                {displayPages.map(i => (
                    <Button
                        key={`page-${i}`}
                        secondary
                        label={`${i}`}
                        onClick={createHandlePageClick(i)}
                        className={i === props.page ? styles.active : ''}
                        disabled={props.disabled}
                    />
                ))}
            </div>
            <Button
                onClick={handleNextClick}
                secondary
                size='md'
                icon={IconOutline.ChevronRightIcon}
                iconToRight
                disabled={props.page === totalPages || props.disabled}
                className={styles.next}
            />
            {!Number.isNaN(totalPages) && (
                <Button
                    onClick={handleLastClick}
                    secondary
                    size='md'
                    icon={IconOutline.ChevronDoubleRightIcon}
                    iconToRight
                    disabled={props.page === totalPages || props.disabled}
                    className={styles.last}
                />
            )}
        </div>
    )
}

export default Pagination
