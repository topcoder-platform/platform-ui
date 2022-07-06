import { useCallback, useEffect } from 'react'

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
