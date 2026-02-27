import { FC, useContext, useEffect } from 'react'

import { authUrlLogin, profileContext, ProfileContextData } from '~/libs/core'

import { ChallengesFeedPanel } from './components/ChallengesFeedPanel'
import { MySubmissionsPanel } from './components/MySubmissionsPanel'
import { TCTimeWidget } from './components/TCTimeWidget'
import { ThriveArticlesFeedPanel } from './components/ThriveArticlesFeedPanel'
import styles from './HomePage.module.scss'

/**
 * Community home dashboard page.
 *
 * @returns Home page content.
 */
const HomePage: FC = () => {
    const { isLoggedIn }: ProfileContextData = useContext(profileContext)

    useEffect(() => {
        document.title = 'Home | Topcoder'
    }, [])

    useEffect(() => {
        if (!isLoggedIn) {
            window.location.assign(authUrlLogin(window.location.href))
        }
    }, [isLoggedIn])

    if (!isLoggedIn) {
        return <></>
    }

    return (
        <section className={styles.page}>
            <div className={styles.leftColumn}>
                <TCTimeWidget />
            </div>

            <div className={styles.centerColumn}>
                <ChallengesFeedPanel />
                <MySubmissionsPanel />
            </div>

            <div className={styles.rightColumn}>
                <ThriveArticlesFeedPanel />
            </div>
        </section>
    )
}

export default HomePage
