import { FC } from 'react'
import { generatePath, Link } from 'react-router-dom'

import { LoadingSpinner } from '~/libs/ui'

import {
    challengeDetailRouteId,
    challengeListingRouteId,
    rootRoute,
} from '../../../../config/routes.config'
import {
    ChallengeInfo,
    getPlacementPrizes,
    useChallenges,
    UseChallengesResult,
} from '../../../../lib'

import styles from './ChallengesFeedPanel.module.scss'

function withLeadingSlash(path: string): string {
    return path.startsWith('/')
        ? path
        : `/${path}`
}

function getPrizeDisplay(challenge: ChallengeInfo): string {
    if (challenge.funChallenge) {
        return 'Fun'
    }

    const placementPrizes = getPlacementPrizes(challenge)

    if (!placementPrizes.length) {
        return '$0'
    }

    const prizeTotal = placementPrizes.reduce(
        (total, prize) => total + Number(prize.value || 0),
        0,
    )
    const isPointBasedPrize = placementPrizes[0].type === 'POINT'

    return isPointBasedPrize
        ? `${prizeTotal.toLocaleString()} pts`
        : `$${prizeTotal.toLocaleString()}`
}

/**
 * Displays open opportunities for registration.
 *
 * @returns Challenges feed panel content.
 */
const ChallengesFeedPanel: FC = () => {
    const {
        challenges,
        isLoading,
    }: UseChallengesResult = useChallenges({
        currentPhaseName: 'Registration',
        perPage: 5,
        sortBy: 'updated',
        sortOrder: 'desc',
        status: 'ACTIVE',
    })

    const listingPath = withLeadingSlash(`${rootRoute}/${challengeListingRouteId}`)
        .replace(/\/{2,}/g, '/')

    return (
        <section className={styles.container}>
            <header className={styles.header}>
                <h2 className={styles.title}>Opportunities</h2>
                <Link className={styles.viewAll} to={listingPath}>View all</Link>
            </header>

            {isLoading && (
                <div className={styles.loading}>
                    <LoadingSpinner inline />
                </div>
            )}

            {!isLoading && !challenges.length && (
                <p className={styles.emptyState}>No open challenges</p>
            )}

            {!isLoading && challenges.length > 0 && (
                <div className={styles.rows}>
                    {challenges.map(challenge => {
                        const challengePath = withLeadingSlash(
                            `${rootRoute}/${generatePath(challengeDetailRouteId, {
                                challengeId: challenge.id,
                            })}`,
                        )
                            .replace(/\/{2,}/g, '/')

                        return (
                            <article className={styles.row} key={challenge.id}>
                                <Link className={styles.challengeName} to={challengePath}>
                                    {challenge.name}
                                </Link>
                                <p className={styles.prize}>{getPrizeDisplay(challenge)}</p>
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

export default ChallengesFeedPanel
