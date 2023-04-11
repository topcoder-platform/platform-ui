import * as React from 'react'

import { TOC } from './markdownRenderer'
import styles from './TableOfContents.module.scss'

interface TableOfContentsProps {
    toc: TOC
}

export const TableOfContents: React.FC<TableOfContentsProps> = props => {
    const [activeIndex, setActiveIndex]: [
        number,
        React.Dispatch<React.SetStateAction<number>>
    ] = React.useState(-1)
    const items: TOC = React.useMemo(() => props.toc.filter(item => item.level === 2 || item.level === 3), [props.toc])

    const navRef: React.RefObject<HTMLElement> = React.createRef<HTMLElement>()

    const findActiveIndex: () => void = React.useCallback(() => {
        for (let i: number = 0; i < items.length; i++) {
            const h: HTMLElement | null = document.getElementById(
                items[i].headingId,
            )
            if (
                h
                && h.offsetTop
                    < document.documentElement.scrollTop
                        + document.documentElement.clientHeight / 2
            ) {
                setActiveIndex(i)
                const liNodes: NodeListOf<HTMLLIElement> | undefined
                    = navRef.current?.querySelectorAll('li')
                if (navRef.current && liNodes) {
                    navRef.current.scrollTop
                        = liNodes[i].offsetTop
                        > document.documentElement.clientHeight - 100
                            ? liNodes[liNodes.length - 1].offsetTop
                            : 0
                }
            }
        }
    }, [items, navRef])

    useOnScroll({ onScroll: findActiveIndex })

    return (
        <nav ref={navRef} className={styles.nav}>
            <div className={styles.navLabel}>ON THIS PAGE</div>
            {items.length > 0 ? (
                <ul>
                    {items.map((item, index) => (
                        <li
                            key={`${item.title}-${index as any}`}
                            className={`${styles.navListItem} ${
                                index === activeIndex ? styles.active : ''
                            }`}
                        >
                            <a
                                href={`#${item.headingId}`}
                                className={`${styles['navListItem-link']} ${
                                    styles[
                                        `navListItem-link-padding-level${item.level}`
                                    ]
                                }`}
                            >
                                {item.title}
                            </a>
                        </li>
                    ))}
                </ul>
            ) : undefined}
        </nav>
    )
}

function useOnScroll({ onScroll }: { onScroll: () => void }): void {
    const debounceTimer: React.MutableRefObject<
        ReturnType<typeof setTimeout> | undefined
    > = React.useRef<ReturnType<typeof setTimeout>>()
    React.useEffect(() => {
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

        onScroll()
        window.addEventListener('scroll', handleScroll)
        return () => {
            clearTimeout(debounceTimer.current)
            window.removeEventListener('scroll', handleScroll)
        }
    }, [onScroll])
}

export default TableOfContents
