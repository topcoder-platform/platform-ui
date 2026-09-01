import { useEffect, useState } from 'react'

export const MOBILE_MAX_WIDTH = 744

export function useMobileView(): boolean {
    const [isMobile, setIsMobile] = useState(() => (
        typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX_WIDTH
    ))

    useEffect(() => {
        const update = (): void => {
            setIsMobile(window.innerWidth <= MOBILE_MAX_WIDTH)
        }

        update()
        window.addEventListener('resize', update)

        return () => {
            window.removeEventListener('resize', update)
        }
    }, [])

    return isMobile
}
