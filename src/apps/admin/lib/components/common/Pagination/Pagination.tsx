import { FC, useCallback, useEffect, useState } from 'react'

import { Button, IconOutline } from '~/libs/ui'
import styles from './Pagination.module.scss'
import { useWindowSize } from '~/libs/shared'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const Pagination: FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  const MAX_PAGE_DISPLAY = 3
  const [displayPages, setDisplayPages] = useState<number[]>([])

  const createDisplayPages = useCallback(() => {
    setDisplayPages((displayPages) => {
      if (displayPages.includes(page)) {
        return [...displayPages]
      }

      // Initial
      if (displayPages.length === 0) {
        const pages = []
        for (let i = page - MAX_PAGE_DISPLAY + 1; i <= page; i++) {
          if (i >= 1) {
            pages.push(i)
          }
        }
        return pages
      }

      // Go next
      if (page > displayPages[displayPages.length - 1]) {
        const pages = []
        for (let i = page - MAX_PAGE_DISPLAY + 1; i <= page; i++) {
          if (i >= 1) {
            pages.push(i)
          }
        }
        return pages
      }

      // Go previous
      if (page < displayPages[0] && page >= 1) {
        const pages = []
        for (let i = page; i < page + MAX_PAGE_DISPLAY; i++) {
          pages.push(i)
        }
        return pages
      }
      return [...displayPages]
    })
  }, [page])

  useEffect(() => {
    createDisplayPages()
  }, [createDisplayPages])

  const handlePageClick = (p: number) => {
    if (p === 0 || p > totalPages || p === page) {
      return false
    }
    onPageChange(p)
  }

  return (
    <div className={styles.pageButtons}>
      <Button
        onClick={() => onPageChange(1)}
        secondary
        size='md'
        icon={IconOutline.ChevronDoubleLeftIcon}
        iconToLeft
        label='FIRST'
        disabled={page === 1}
        className={styles.first}
      />
      <Button
        onClick={() => onPageChange(page - 1)}
        secondary
        size='md'
        icon={IconOutline.ChevronLeftIcon}
        iconToLeft
        label='PREVIOUS'
        disabled={page === 1}
        className={styles.previous}
      />
      <div className={styles.pageNumbers}>
        {displayPages.map((i) => (
          <Button
            key={`page-${i}`}
            secondary
            variant='round'
            label={`${i}`}
            onClick={() => handlePageClick(i)}
            className={i === page ? styles.active : ''}
          />
        ))}
      </div>
      <Button
        onClick={() => onPageChange(page + 1)}
        secondary
        size='md'
        icon={IconOutline.ChevronRightIcon}
        iconToRight
        label='NEXT'
        disabled={page === totalPages}
        className={styles.next}
      />
    </div>
  )
}

export default Pagination
