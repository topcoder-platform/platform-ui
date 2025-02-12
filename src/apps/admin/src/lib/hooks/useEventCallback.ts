import { useEffect, useRef } from 'react'

/**
 * Return a wrapper function that stays the same on every re-rendering while still using the latest callback.
 */
function useEventCallback<Args extends unknown[], R>(
    fn: (...args: Args) => R,
): (...args: Args) => R {
    const fnRef = useRef(fn)
    useEffect(() => {
        fnRef.current = fn
    })

    const cb = useRef((...args: Args): R => fnRef.current(...args))
    return cb.current
}

export { useEventCallback }
