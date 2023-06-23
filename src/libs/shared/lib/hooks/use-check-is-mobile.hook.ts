import { Dispatch, SetStateAction, useEffect, useState } from 'react'

function checkIsMobile(): boolean {
    // TODO: fix this
    return window.innerWidth <= 768
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
