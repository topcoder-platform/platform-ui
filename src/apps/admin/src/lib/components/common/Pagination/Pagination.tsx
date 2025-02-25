import { FC, useCallback, useEffect, useMemo, useState } from 'react'

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
    const MAX_PAGE_DISPLAY = 5
    const MAX_PAGE_MOBILE_DISPLAY = 3
    const { width: screenWidth }: WindowSize = useWindowSize()

    const [displayPages, setDisplayPages] = useState<number[]>([])
    const mobiledisplayPages = useMemo(() => {
        if (displayPages.length <= MAX_PAGE_MOBILE_DISPLAY) {
            return displayPages
        }

        const LEFT = MAX_PAGE_MOBILE_DISPLAY % 2 === 0 ? MAX_PAGE_MOBILE_DISPLAY / 2 : (MAX_PAGE_MOBILE_DISPLAY + 1) / 2
        const RIGHT = MAX_PAGE_MOBILE_DISPLAY - LEFT
        const index = displayPages.indexOf(props.page)
        let start = Math.max(0, index - LEFT)
        let end = Math.min(index + RIGHT, displayPages.length)
        if (end - start < MAX_PAGE_MOBILE_DISPLAY) {
            start = Math.min(Math.max(0, end - MAX_PAGE_MOBILE_DISPLAY), start)
        }

        if (end - start < MAX_PAGE_MOBILE_DISPLAY) {
            end = Math.min(Math.max(start + MAX_PAGE_MOBILE_DISPLAY, end), displayPages.length)
        }

        return displayPages.slice(start, end)
    }, [displayPages, props.page, screenWidth]) // eslint-disable-line react-hooks/exhaustive-deps, max-len -- unneccessary dependency: screenWidth

    const createDisplayPages = useCallback(() => {
        setDisplayPages(oldDisplayPages => {
            if (oldDisplayPages.includes(props.page)) {
                return [...oldDisplayPages]
            }

            // Initial
            if (oldDisplayPages.length === 0) {
                const pages = []
                for (
                    let i = props.page - MAX_PAGE_DISPLAY + 1;
                    i <= props.page;
                    i++
                ) {
                    if (i >= 1) {
                        pages.push(i)
                    }
                }

                return pages
            }

            // Go next
            if (props.page > oldDisplayPages[oldDisplayPages.length - 1]) {
                const pages = []
                for (
                    let i = props.page - MAX_PAGE_DISPLAY + 1;
                    i <= props.page;
                    i++
                ) {
                    if (i >= 1) {
                        pages.push(i)
                    }
                }

                return pages
            }

            // Go previous
            if (props.page < oldDisplayPages[0] && props.page >= 1) {
                const pages = []
                for (
                    let i = props.page;
                    i < props.page + MAX_PAGE_DISPLAY;
                    i++
                ) {
                    pages.push(i)
                }

                return pages
            }

            return [...oldDisplayPages]
        })
    }, [props.page])

    useEffect(() => {
        createDisplayPages()
    }, [createDisplayPages])

    const createHandlePageClick = (p: number) => () => {
        if (p === 0 || p > props.totalPages || p === props.page) {
            return
        }

        props.onPageChange(p)
    }

    const handleFirstClick = useEventCallback(() => props.onPageChange(1))
    const handlePreviousClick = useEventCallback(() => props.onPageChange(props.page - 1))
    const handleNextClick = useEventCallback(() => props.onPageChange(props.page + 1))
    const handleLastClick = useEventCallback(() => props.onPageChange(props.totalPages))

    return (
        <div className={styles.pageButtons}>
            <Button
                onClick={handleFirstClick}
                secondary
                size='md'
                icon={IconOutline.ChevronDoubleLeftIcon}
                iconToLeft
                label='FIRST'
                disabled={props.page === 1 || props.disabled}
                className={styles.first}
            />
            <Button
                onClick={handlePreviousClick}
                secondary
                size='md'
                icon={IconOutline.ChevronLeftIcon}
                iconToLeft
                label='PREVIOUS'
                disabled={props.page === 1 || props.disabled}
                className={styles.previous}
            />
            <div className={styles.pageNumbers}>
                {(screenWidth < 767 ? mobiledisplayPages : displayPages).map(i => (
                    <Button
                        key={`page-${i}`}
                        secondary
                        variant='round'
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
                label='NEXT'
                disabled={props.page === props.totalPages || props.disabled}
                className={styles.next}
            />
            {!Number.isNaN(props.totalPages) && (
                <Button
                    onClick={handleLastClick}
                    secondary
                    size='md'
                    icon={IconOutline.ChevronDoubleRightIcon}
                    iconToRight
                    label='LAST'
                    disabled={props.page === props.totalPages || props.disabled}
                    className={styles.last}
                />
            )}
        </div>
    )
}

export default Pagination
