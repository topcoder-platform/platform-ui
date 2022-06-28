import { MouseEvent as RMouseEvent, MouseEventHandler, MutableRefObject, useCallback, useEffect, useRef } from 'react'

/**
 * Registers an outside click event handler, and calls the callback on click outside
 * @param el Html element to register the event handler for
 * @param cb Callback function to be called on click outside of provided element
 */
export function useClickOutside(el: HTMLElement | null, cb: (ev: MouseEvent) => void): void {
    const handleClick: (ev: MouseEvent) => void = useCallback((ev: MouseEvent) => {
        if (el && !el.contains(ev.target as unknown as Node)) {
            cb(ev)
        }
    }, [cb, el])

    useEffect(() => {
        if (!el) {
            document.removeEventListener('click', handleClick)
            return
        }

        document.addEventListener('click', handleClick)
        return () => {
            document.removeEventListener('click', handleClick)
        }
    }, [el, handleClick])
}

export interface UseHoverElementValue {
    onMouseEnter: MouseEventHandler<HTMLDivElement>
    onMouseLeave: MouseEventHandler<HTMLDivElement>
}

/**
 * Create event handlers for hover in/hover out for the passed element
 * @param el Html element to register the event handlers for
 * @param cb Callback function to be called on hover in/hover out of provided element
 */
export function useOnHoverElement(el: HTMLElement | null, cb: (isVisible: boolean) => void): UseHoverElementValue {
    const counter: MutableRefObject<number> = useRef(0)

    const handleHover: (ev: RMouseEvent<Element, MouseEvent>) => void = useCallback((ev: RMouseEvent<Element, MouseEvent>) => {
        const nextVal: number = Math.max(0, counter.current + (ev.type === 'mouseenter' ? 1 : -1))
        if (!!nextVal !== !!counter.current) {
            cb(nextVal > 0)
        }
        counter.current = nextVal
    }, [cb, el])

    return {
        onMouseEnter: handleHover,
        onMouseLeave: handleHover,
    }
}
