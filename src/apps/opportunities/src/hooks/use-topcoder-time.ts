import { useEffect, useState } from 'react'

import { formatTopcoderTime } from '../utils/home.utils'

const MINUTE_MS = 60 * 1000

/**
 * Keeps the community-app "Topcoder Time" clock current.
 *
 * Used by `HomeTopcoderTime`. Instead of community-app's fixed 60-second
 * interval from mount, the next update is scheduled for the start of the next
 * minute so the displayed minute is never stale.
 *
 * @returns the current US Eastern time, for example `Oct 8th, 07:31 UTC-4`.
 * @throws Does not throw.
 */
export function useTopcoderTime(): string {
    const [time, setTime] = useState(() => formatTopcoderTime(new Date()))

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined

        /** Shows the current minute and schedules the next update. */
        const tick = (): void => {
            const now = new Date()
            setTime(formatTopcoderTime(now))
            timer = setTimeout(tick, MINUTE_MS - (now.getTime() % MINUTE_MS))
        }

        tick()
        return () => clearTimeout(timer)
    }, [])

    return time
}
