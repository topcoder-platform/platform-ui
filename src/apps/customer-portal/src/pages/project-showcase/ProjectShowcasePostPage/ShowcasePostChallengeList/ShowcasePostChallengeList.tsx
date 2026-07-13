/* eslint-disable complexity */
import { FC, useMemo } from 'react'
import classNames from 'classnames'

import { IconOutline, LinkButton } from '~/libs/ui'
import { UseFetchChallenges, useFetchChallenges } from '~/apps/customer-portal/src/lib'

import { getTrackName, toClassName } from '../../utils'

import styles from './ShowcasePostChallengeList.module.scss'

interface ShowcasePostChallengeListProps {
    challengeIds?: string[]
}

const ShowcasePostChallengeList: FC<ShowcasePostChallengeListProps> = props => {
    const challengeIds = useMemo(() => props.challengeIds ?? [], [props.challengeIds])

    const {
        data: challenges = [],
        error,
        isValidating,
    }: UseFetchChallenges = useFetchChallenges(challengeIds)

    const hasChallenges = challenges.length > 0

    return (
        <div className={styles.wrap}>
            {isValidating && <div className={styles.message}>Loading challenges…</div>}
            {error && <div className={styles.message}>Unable to load challenges.</div>}
            {!isValidating && !error && !hasChallenges && (
                <div className={styles.message}>No challenges found.</div>
            )}
            {hasChallenges && (
                <ul className={styles.list}>
                    {challenges.map(challenge => (
                        <li key={challenge.id} className={styles.item}>
                            <div className={styles.itemContent}>
                                <span className={classNames(styles.itemMeta, toClassName(getTrackName(challenge)))}>
                                    {getTrackName(challenge)}
                                </span>
                                <span className={styles.itemTitle}>{challenge.name}</span>
                            </div>
                            <div className={styles.toRight}>
                                {(typeof challenge.numOfRegistrants === 'number'
                                    || typeof challenge.numOfSubmissions === 'number') && (
                                    <div className={styles.itemStats}>
                                        {typeof challenge.numOfRegistrants === 'number' && (
                                            <span>
                                                {challenge.numOfRegistrants}
                                                {' '}
                                                registrants
                                            </span>
                                        )}
                                        {typeof challenge.numOfSubmissions === 'number' && (
                                            <span className={styles.statSeparator}>
                                                {challenge.numOfSubmissions}
                                                {' '}
                                                submissions
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className={styles.action}>
                                    <LinkButton
                                        size='lg'
                                        label='View'
                                        iconToRight
                                        icon={IconOutline.ArrowRightIcon}
                                        to=''
                                    />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default ShowcasePostChallengeList
