import { FC } from 'react'

import { useTopcoderTime } from '../hooks/use-topcoder-time'

import styles from './HomeTopcoderTime.module.scss'

/**
 * Renders the member home "Topcoder Time" card ported from community-app's
 * dashboard `TCTime` widget: the current US Eastern time and UTC offset,
 * refreshed every minute.
 *
 * @returns the Topcoder Time sidebar card.
 * @throws Does not throw.
 */
export const HomeTopcoderTime: FC = () => {
    const time = useTopcoderTime()

    return (
        <section aria-labelledby='home-topcoder-time-title' className={styles.card}>
            <h2 className={styles.title} id='home-topcoder-time-title'>Topcoder Time</h2>
            <p className={styles.time}>{time}</p>
        </section>
    )
}

export default HomeTopcoderTime
