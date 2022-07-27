import * as React from 'react'

import { TOC } from './markdownRenderer'
import styles from './TableOfContents.module.scss'

export interface TableOfContentsProps {
  toc: TOC
}

export const TableOfContents: React.FunctionComponent<TableOfContentsProps> = (props) => {
  const [activeIndex, setActiveIndex]: [number, React.Dispatch<React.SetStateAction<number>>] = React.useState(-1)
  const { toc }: { toc: TOC } = props
  const items: TOC = React.useMemo(() => {
    return toc.filter(item => item.level === 2)
  }, [toc])

  const findActiveIndex: () => void = React.useCallback(() => {
    for (let i: number = 0; i < items.length; i++) {
      const h: HTMLElement | null = document.getElementById(items[i].headingId)
      if (h && h.offsetTop < document.documentElement.scrollTop + document.documentElement.clientHeight / 2) {
        setActiveIndex(i)
      }
    }
  }, [items])

  useOnScroll({ onScroll: findActiveIndex })

  return (
    <nav className={styles['nav']}>
      <div className={styles['navLabel']}>ON THIS PAGE</div>
      { items.length > 0 ? (
        <ul className={styles['navList']}>
          { items.map((item, index) => (
            <li key={item.title} className={`${styles['navListItem']} ${index === activeIndex ? styles['active'] : ''}`}>
              <a href={`#${item.headingId}`} className={`${styles['navListItem-link']}`}>{item.title}</a>
            </li>
          ))}
        </ul>
      ) : undefined }
    </nav>
  )
}

function useOnScroll({ onScroll }: { onScroll: () => void }): void {
  const debounceTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | undefined> = React.useRef<ReturnType<typeof setTimeout>>()
  const handleScroll: () => void = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = undefined
    }
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = undefined
      onScroll()
    }, 1)
  }

  React.useEffect(() => {
    onScroll()
    window.addEventListener('scroll', handleScroll)
    return () => {
      clearTimeout(debounceTimer.current)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [onScroll])
}

export default TableOfContents
