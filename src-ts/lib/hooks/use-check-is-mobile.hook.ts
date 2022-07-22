import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { Breakpoints } from '../styles'

function checkIsMobile(): boolean {
    return window.innerWidth <= Breakpoints.mdMax
}

export function useCheckIsMobile(): boolean {
    const [isMobile, setIsMobile]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(checkIsMobile())

    useEffect(() => {
        function handleResize(): void {
            setIsMobile(checkIsMobile())
        }

        window.addEventListener('resize', handleResize)

        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return isMobile
}
