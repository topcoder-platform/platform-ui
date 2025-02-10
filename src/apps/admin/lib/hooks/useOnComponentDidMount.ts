import { useEffect, useRef } from 'react'

/**
 * Runs the callback when the component mounted.
 * React Strict Mode (Development Only) unmounts and remounts components twice in development mode.
 */
export function useOnComponentDidMount(onMounted: () => void) {
    const hasMounted = useRef(false)

    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true
            onMounted()
        }
    }, [])
}
