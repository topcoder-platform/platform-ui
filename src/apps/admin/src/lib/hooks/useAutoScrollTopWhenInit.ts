import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Auto scroll to top when open page
 */
export function useAutoScrollTopWhenInit(): void {
    const location = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [location.pathname])
}
