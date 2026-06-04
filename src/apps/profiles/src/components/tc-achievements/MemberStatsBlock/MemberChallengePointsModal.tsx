import { FC, useMemo } from 'react'

import { EnvironmentConfig } from '~/config'
import { UserChallengePointsDetail, UserChallengePointsSummary } from '~/libs/core'
import { BaseModal } from '~/libs/ui'

import { formatPlural } from '../../../lib'

import styles from './MemberChallengePointsModal.module.scss'

interface MemberChallengePointsModalProps {
    challengePoints: UserChallengePointsSummary
    onClose: () => void
}

const numberFormatter = new Intl.NumberFormat('en-US')

/**
 * Formats challenge point values using the comma grouping shown in profile cards.
 *
 * @param {number} value - Raw point value to render.
 * @returns {string} Locale-formatted point value.
 */
const formatPoints = (value: number): string => numberFormatter.format(value)

/**
 * Builds a challenge details URL from the configured Topcoder challenges base path.
 *
 * @param {string} challengeId - Challenge identifier from member-api.
 * @returns {string} Absolute challenge details URL.
 */
const getChallengeUrl = (challengeId: string): string => (
    `${EnvironmentConfig.URLS.CHALLENGES_PAGE}/${challengeId}`
)

const MemberChallengePointsModal: FC<MemberChallengePointsModalProps> = (
    props: MemberChallengePointsModalProps,
) => {
    const details = useMemo(() => (
        [...(props.challengePoints.details ?? [])]
            .sort((
                detailA: UserChallengePointsDetail,
                detailB: UserChallengePointsDetail,
            ) => (
                detailA.challengeName.localeCompare(detailB.challengeName)
                || detailA.placement - detailB.placement
            ))
    ), [props.challengePoints.details])

    return (
        <BaseModal
            bodyClassName={styles.body}
            classNames={{ modal: styles.modal }}
            onClose={props.onClose}
            open
            spacer={false}
            title={(
                <h3 className={styles.title}>
                    Challenge Points
                </h3>
            )}
            size='md'
        >
            <div className={styles.content}>
                <div className={styles.summary}>
                    <span className={styles.summaryValue}>
                        {formatPoints(props.challengePoints.total)}
                    </span>
                    <span className={styles.summaryLabel}>
                        from
                        {' '}
                        {formatPoints(props.challengePoints.challenges)}
                        {' '}
                        {formatPlural(props.challengePoints.challenges, 'challenge')}
                    </span>
                </div>

                <div className={styles.table}>
                    <div className={styles.tableHeader}>
                        <span>Challenge</span>
                        <span>Place</span>
                        <span>Points</span>
                    </div>

                    {details.map((detail: UserChallengePointsDetail) => (
                        <div className={styles.tableRow} key={`${detail.challengeId}-${detail.userId}`}>
                            <a
                                className={styles.challengeLink}
                                href={getChallengeUrl(detail.challengeId)}
                                rel='noreferrer'
                                target='_blank'
                            >
                                {detail.challengeName || `Challenge ${detail.challengeId}`}
                            </a>
                            <span className={styles.placement}>
                                #
                                {detail.placement}
                            </span>
                            <span className={styles.points}>
                                {formatPoints(detail.points)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </BaseModal>
    )
}

export default MemberChallengePointsModal
