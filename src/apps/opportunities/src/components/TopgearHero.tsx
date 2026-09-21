import { FC } from 'react'

import topgearBanner from '../assets/topgear-challenges-banner.png'

import styles from './TopgearHero.module.scss'

/**
 * Renders community-app's TopGear challenge-listing banner in place of the
 * Opportunities masthead. TopGear members only browse competitions, so the
 * category cells and public summary totals are not shown on that host.
 *
 * @returns the full-width TopGear banner.
 * @throws Does not throw.
 */
export const TopgearHero: FC = () => (
    <section aria-label='TopGear challenges' className={styles.hero}>
        <img
            alt='TopGear: amazing platform for design, testing and development challenges'
            className={styles.banner}
            src={topgearBanner}
        />
    </section>
)

export default TopgearHero
