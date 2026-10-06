import { FC, useCallback, useLayoutEffect, useRef, useState } from 'react'
import classNames from 'classnames'

import { Button } from '~/libs/ui'

import styles from './ExpandableText.module.scss'

interface ExpandableTextProps {
    text: string
    className?: string
}

/**
 * Read-only text clamped to three lines, with a "Show more" toggle for the rest.
 *
 * The toggle only appears when the text actually overflows the clamp, which is measured rather than
 * guessed from the character count: line length depends on the column width and the viewport.
 */
const ExpandableText: FC<ExpandableTextProps> = (props: ExpandableTextProps) => {
    const textRef = useRef<HTMLDivElement>(null)
    const [isExpanded, setIsExpanded] = useState<boolean>(false)
    const [isOverflowing, setIsOverflowing] = useState<boolean>(false)
    const isOverflowingRef = useRef<boolean>(false)

    useLayoutEffect(() => {
        const element = textRef.current

        if (!element || isExpanded) {
            return undefined
        }

        const measure = (): void => {
            const next = element.scrollHeight > element.clientHeight + 1

            // Resize callbacks fire often; only re-render when the answer actually changes.
            if (next !== isOverflowingRef.current) {
                isOverflowingRef.current = next
                setIsOverflowing(next)
            }
        }

        measure()

        if (typeof ResizeObserver === 'undefined') {
            return undefined
        }

        const observer = new ResizeObserver(measure)
        observer.observe(element)

        return () => observer.disconnect()
    }, [isExpanded, props.text])

    const toggle = useCallback(() => {
        setIsExpanded(current => !current)
    }, [])

    return (
        <div className={props.className}>
            <div
                className={classNames(styles.text, isExpanded ? undefined : styles.clamped)}
                ref={textRef}
            >
                {props.text}
            </div>
            {(isOverflowing || isExpanded) && (
                <Button
                    className={styles.toggle}
                    label={isExpanded ? 'Show less' : 'Show more'}
                    link
                    onClick={toggle}
                    size='sm'
                />
            )}
        </div>
    )
}

export default ExpandableText
