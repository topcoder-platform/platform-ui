import { useCallback, useEffect } from 'react'
import _ from 'lodash'

/**
 * Registers an outside click event handler, and calls the callback on click outside
 * @param el Html element to register the event handler for
 * @param cb Callback function to be called on click outside of provided element
 * @param enabled Enable or disable the hook
 */
export function useClickOutside(
    el: HTMLElement | null,
    cb: (ev: MouseEvent) => void,
    enabled: boolean = true,
    options: { capture?: boolean } = {},
): void {
    const handleClick: (ev: MouseEvent) => void = useCallback((ev: MouseEvent) => {
        if (el && (!el.contains(ev.target as unknown as Node))) {
            cb(ev)
        }
    }, [cb, el])

    useEffect(() => {
        // Some component stops the event propagation in the bubble phase
        const eventListenerOptions = options?.capture ? { capture: true } : undefined

        if (!enabled) {
            return undefined
        }

        if (!el) {
            document.removeEventListener('click', handleClick, eventListenerOptions)
            return undefined
        }

        document.addEventListener('click', handleClick, eventListenerOptions)
        return () => {
            document.removeEventListener('click', handleClick, eventListenerOptions)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [el, handleClick, enabled])
}

/**
 * Registers an outside click event handler, and calls the callback on click outside
 * @param els Html elements to register the event handler for
 * @param cb Callback function to be called on click outside of provided element
 * @param enabled Enable or disable the hook
 */
export function useClickOutsideMultipleElements(
    els: HTMLElement[],
    cb: (ev: MouseEvent) => void,
    enabled: boolean = true,
    options: { capture?: boolean } = {},
): void {
    const handleClick: (ev: MouseEvent) => void = useCallback((ev: MouseEvent) => {
        if (_.every(els, el => !el.contains(ev.target as unknown as Node))) {
            cb(ev)
        }
    }, [cb, els])

    useEffect(() => {
        // Some component stops the event propagation in the bubble phase
        const eventListenerOptions = options?.capture ? { capture: true } : undefined

        if (!enabled) {
            return undefined
        }

        if (!els.length) {
            document.removeEventListener('click', handleClick, eventListenerOptions)
            return undefined
        }

        document.addEventListener('click', handleClick, eventListenerOptions)
        return () => {
            document.removeEventListener('click', handleClick, eventListenerOptions)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [els, handleClick, enabled])
}
