import { MutableRefObject, useRef } from 'react'

import { useWindowSize, WindowSize } from './use-window-size.hook'

/**
 * On mobile, vh units are not consistent accross devices/browsers,
 * this hook listen to window resize and fixes sets a --vh CSS variable
 * on the document root, so we can access it everywhere
 *
 * @see https://css-tricks.com/the-trick-to-viewport-units-on-mobile
 */
export function useViewportUnitsFix(): void {
    const { height }: WindowSize = useWindowSize()
    const wasHeight: MutableRefObject<number> = useRef(height)

    if (wasHeight.current !== height) {
        // We execute the same script as before
        const vh: number = window.innerHeight * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
}
