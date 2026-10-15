/* eslint-disable react/jsx-no-bind */
import { FC } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ProfileContextData, useProfileContext } from '~/libs/core'
import { IconOutline } from '~/libs/ui'

import { useHomeChallengeFeed } from '../hooks/use-home-challenge-feed'
import { HOME_CHALLENGE_FEED_SIZE } from '../utils/home.utils'

import { OpportunityListCard } from './OpportunityListCard'
import styles from './HomeChallengesFeed.module.scss'

interface HomeChallengesFeedProps {
    /** Browse Competitions route for the "View all" link and skill searches. */
    listingRoute: string
}

/**
 * Renders the member home "Opportunities" feed ported from community-app's
 * dashboard `ChallengesFeed`.
 *
 * Shows up to five active Challenge, First2Finish, and Marathon Match
 * challenges that are open for registration (excluding Innovation
 * Challenges) using the shared Opportunities competition card in its list
 * presentation (which stacks responsively on narrow screens), with the
 * member's Registered state. "View all" and the card
 * skill chips open Browse Competitions. Unlike community-app, which hid the
 * section whenever it had no items, the feed shows loading, empty, and
 * retryable error states.
 *
 * @param props Browse Competitions route for the current host.
 * @returns the Opportunities feed section.
 * @throws Does not throw; Challenge API failures render an in-page retry state.
 */
export const HomeChallengesFeed: FC<HomeChallengesFeedProps> = (props: HomeChallengesFeedProps) => {
    const { profile }: ProfileContextData = useProfileContext()
    const navigate = useNavigate()
    const feed = useHomeChallengeFeed(profile?.userId === undefined ? undefined : String(profile.userId))

    /**
     * Opens Browse Competitions filtered by a card's tag or skill.
     *
     * @param skill selected tag or standardized skill label.
     * @returns void.
     * @throws Does not throw.
     */
    const searchSkill = (skill: string): void => {
        navigate(`${props.listingRoute}?${new URLSearchParams({ search: skill })
            .toString()}`)
    }

    return (
        <section aria-labelledby='home-opportunities-title' className={styles.feed}>
            <header className={styles.header}>
                <h2 className={styles.title} id='home-opportunities-title'>Opportunities</h2>
                <Link className={styles.viewAll} to={props.listingRoute}>
                    View all
                    <IconOutline.ArrowRightIcon aria-hidden='true' />
                </Link>
            </header>
            {feed.loading && (
                <div aria-label='Loading opportunities' className={styles.loading} role='status'>
                    {Array.from({ length: HOME_CHALLENGE_FEED_SIZE }, (_, index) => <span key={index} />)}
                </div>
            )}
            {feed.error && (
                <div className={styles.message} role='alert'>
                    <IconOutline.ExclamationCircleIcon aria-hidden='true' />
                    <h3>We couldn&apos;t load opportunities.</h3>
                    <p>Please try again.</p>
                    <button onClick={feed.retry} type='button'>Try again</button>
                </div>
            )}
            {!feed.loading && !feed.error && !feed.challenges.length && (
                <div className={styles.empty}>
                    <h3>No open competitions right now</h3>
                    <p>Check back later, or browse every opportunity.</p>
                </div>
            )}
            {feed.challenges.length > 0 && (
                <div className={styles.list}>
                    {feed.challenges.map(challenge => (
                        <OpportunityListCard
                            item={challenge}
                            key={challenge.id}
                            kind='competitions'
                            onSkillClick={searchSkill}
                            registered={feed.registeredIds.has(challenge.id)}
                            view='list'
                        />
                    ))}
                </div>
            )}
        </section>
    )
}

export default HomeChallengesFeed
