import { FC, useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { EnvironmentConfig } from '~/config'
import { PageTitle } from '~/libs/ui'

import {
    HomeChallengesFeed,
    HomeCmsViewport,
    HomeTopcoderTime,
} from '../components'
import { rootRoute } from '../opportunities.routes'
import { getHomeViewportIds } from '../utils/home.utils'
import { isTopgearCommunity, TOPGEAR_CHALLENGES_ROUTE } from '../utils/topgear.utils'

import styles from './HomePage.module.scss'

/**
 * Member home page at `/opportunities/home` (`/home` on the Opportunities
 * subdomain), replacing community-app's `/home` dashboard (and its
 * `/my-dashboard` alias).
 *
 * Mirrors the community-app layout: Topcoder Time and the left CMS slot on the
 * left, the CMS banner carousel and the Opportunities challenge feed in the
 * center, and the right CMS slot (the "Join us on Discord" call to action) on
 * the right. Narrow screens stack the widgets in community-app's mobile order:
 * time, banner, feed, right slot, left slot. The route is registered with
 * `authRequired`, so anonymous visitors are sent to login with this page as
 * the return URL, as community-app did. The TopGear host has no member home,
 * so it is redirected to the TopGear challenge listing.
 *
 * @returns the member home page, or a TopGear listing redirect.
 * @throws Does not throw; each widget handles its own request failures.
 */
export const HomePage: FC = () => {
    const location = useLocation()
    const viewportIds = useMemo(() => getHomeViewportIds(EnvironmentConfig.TC_DOMAIN), [])

    if (isTopgearCommunity()) {
        return <Navigate replace to={`${TOPGEAR_CHALLENGES_ROUTE}${location.search}${location.hash}`} />
    }

    return (
        <main className={styles.page}>
            <PageTitle>Home | Topcoder</PageTitle>
            <h1 className={styles.visuallyHidden}>Home</h1>
            <div className={styles.layout}>
                <div className={styles.column}>
                    <div className={styles.time}>
                        <HomeTopcoderTime />
                    </div>
                    <div className={styles.leftSlot}>
                        <HomeCmsViewport
                            label='Community links'
                            variant='sidebar'
                            viewportId={viewportIds.leftBottom}
                        />
                    </div>
                </div>
                <div className={styles.column}>
                    <div className={styles.banner}>
                        <HomeCmsViewport
                            label='Featured announcements'
                            variant='banner'
                            viewportId={viewportIds.centerTop}
                        />
                    </div>
                    <div className={styles.feed}>
                        <HomeChallengesFeed listingRoute={`${rootRoute}/competitions`} />
                    </div>
                </div>
                <div className={styles.column}>
                    <div className={styles.rightSlot}>
                        <HomeCmsViewport
                            label='Community'
                            variant='sidebar'
                            viewportId={viewportIds.rightBottom}
                        />
                    </div>
                </div>
            </div>
        </main>
    )
}

export default HomePage
