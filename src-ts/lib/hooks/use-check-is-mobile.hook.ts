import { Dispatch, SetStateAction, useEffect, useState } from 'react'

function checkIsMobile(): boolean {
    return window.innerWidth <= 744  // ltemd
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
