import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { Breakpoints } from '../styles'

/**
 *  TODO: Refactor
 *  There is risk of a performance hit if we make this a hook and call it in multiple components,
 *  as it will re-render down the tree, change state at each instance of this hook call, and start
 *  another re-render at that component and below. the resize event is also called constantly as a
 *  window size is dragged, so this could get really janky in the some browsers.
 *  Two recommendations to avoid that:
 *  1. call this once, put the result in state fairly close to the root of the component tree, and use that value
 *  throughout all lower level components.
 *  2. debounce the event listener - it doesn't look like we're debouncing anything in the app yet, but we do import lodash,
 *  which has a debounce function. I'd recommend calling the handler once every 100ms - slow enough that the browser doesn't churn,
 *  but quick enough that most people won't notice.
 */

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
