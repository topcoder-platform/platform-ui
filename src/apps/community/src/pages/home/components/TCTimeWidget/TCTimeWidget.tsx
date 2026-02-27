import { FC, useEffect, useState } from 'react'
import moment from 'moment-timezone'

import styles from './TCTimeWidget.module.scss'

const TOPCODER_TIMEZONE = 'America/New_York'

function formatTimezoneOffset(offsetMinutes: number): string {
    const offsetHours = offsetMinutes / 60
    const sign = offsetHours >= 0 ? '+' : ''

    return `UTC${sign}${offsetHours}`
}

function formatTopcoderTime(): string {
    const now = moment.tz(new Date(), TOPCODER_TIMEZONE)

    return `${now.format('MMM Do, HH:mm')} ${formatTimezoneOffset(now.utcOffset())}`
}

/**
 * Displays current Topcoder time in America/New_York timezone.
 *
 * @returns Time widget content.
 */
const TCTimeWidget: FC = () => {
    const [tcTime, setTCTime] = useState<string>(() => formatTopcoderTime())

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setTCTime(formatTopcoderTime())
        }, 60000)

        return () => {
            window.clearInterval(intervalId)
        }
    }, [])

    return (
        <section className={styles.container}>
            <h2 className={styles.title}>Topcoder Time</h2>
            <p className={styles.time}>{tcTime}</p>
        </section>
    )
}

export default TCTimeWidget
