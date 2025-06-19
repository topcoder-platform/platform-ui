import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'

export interface WindowSize {
  height: number
  width: number
}

export function useWindowSize(): WindowSize {
    const [windowSize, setWindowSize]: [WindowSize, Dispatch<SetStateAction<WindowSize>>] = useState({
        height: 0,
        width: 0,
    })

    const handleResize: () => void = useCallback(() => {
    // Set window width/height to state
        setWindowSize({
            height: window.innerHeight,
            width: window.innerWidth,
        })
    }, [])

    useEffect(() => {
    // Add event listener
        window.addEventListener('resize', handleResize)

        // Call handler right away so state gets updated with initial window size
        handleResize()

        // Remove event listener on cleanup
        return () => window.removeEventListener('resize', handleResize)
    }, [handleResize]) // Empty array ensures that effect is only run on mount

    return windowSize
}
