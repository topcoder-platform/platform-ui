/* eslint-disable jsx-a11y/anchor-is-valid */
import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'

import { getRatingColor, useMemberStats, UserProfile, UserStats } from '~/libs/core'

import { numberToFixed } from '../../../lib'

import { MemberRatingInfoModal } from './MemberRatingInfoModal'
import styles from './MemberRatingCard.module.scss'

interface MemberRatingCardProps {
    profile: UserProfile
}

/**
 * Formats percentile values for the compact rating card.
 *
 * @param {number} percentile - The percentile value returned by the member stats API.
 * @returns {string} A display-ready percentage without unnecessary decimal places.
 */
const formatPercentile = (percentile: number): string => (
    Number.isInteger(percentile) ? `${percentile}` : numberToFixed(percentile)
)

/**
 * Returns the audience label shown under the member's percentile.
 *
 * @param {UserStats | undefined} memberStats - The raw stats payload for the user.
 * @returns {string} The track audience label for the rating card.
 */
const getRatingAudienceLabel = (memberStats?: UserStats): string => {
    switch (memberStats?.maxRating?.track) {
        case 'AI':
        case 'AI_ENGINEER':
        case 'AI_ENGINEERING':
            return 'AI Engineers'
        case 'DATA_SCIENCE':
            return 'Data Scientists'
        case 'DESIGN':
            return 'Designers'
        case 'DEVELOP':
            return 'Developers'
        default:
            return 'Members'
    }
}

const MemberRatingCard: FC<MemberRatingCardProps> = (props: MemberRatingCardProps) => {
    const memberStats: UserStats | undefined = useMemberStats(props.profile.handle)

    const [isInfoModalOpen, setIsInfoModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    const maxPercentile: number = useMemo(() => {
        let memberPercentile: number = 0
        if (memberStats?.DATA_SCIENCE) {
            memberPercentile = memberStats.DATA_SCIENCE.MARATHON_MATCH?.rank?.percentile || 0
            if ((memberStats.DATA_SCIENCE.SRM?.rank?.percentile || 0) > memberPercentile) {
                memberPercentile = memberStats.DATA_SCIENCE.SRM.rank?.percentile || 0
            }
        }

        if (memberStats?.DEVELOP) {
            memberStats.DEVELOP.subTracks.forEach((subTrack: any) => {
                const subPercentile = subTrack.rank.percentile || subTrack.rank.overallPercentile || 0
                if (subPercentile > memberPercentile) {
                    memberPercentile = subPercentile
                }
            })
        }

        return memberPercentile
    }, [memberStats])

    function handleInfoModalClose(): void {
        setIsInfoModalOpen(false)
    }

    function handleInfoModalOpen(): void {
        setIsInfoModalOpen(true)
    }

    const rating: number | undefined = memberStats?.maxRating?.rating
    const audienceLabel: string = getRatingAudienceLabel(memberStats)

    return memberStats?.maxRating?.rating ? (
        <div className={styles.container}>
            <div className={styles.innerWrap}>
                <div className={styles.valueWrap}>
                    <p className={styles.value} style={{ color: getRatingColor(rating) }}>
                        {rating}
                    </p>
                    <p className={styles.name}>Rating</p>
                </div>
                {
                    maxPercentile ? (
                        <div className={styles.valueWrap}>
                            <p className={styles.value} style={{ color: getRatingColor(rating) }}>
                                Top
                                {' '}
                                {formatPercentile(maxPercentile)}
                                %
                            </p>
                            <p className={styles.name}>{audienceLabel}</p>
                        </div>
                    ) : undefined
                }
                <button type='button' className={styles.link} onClick={handleInfoModalOpen}>What is this?</button>
            </div>

            {
                isInfoModalOpen && (
                    <MemberRatingInfoModal
                        onClose={handleInfoModalClose}
                        percentile={maxPercentile}
                        rating={rating}
                        audienceLabel={audienceLabel}
                    />
                )
            }
        </div>
    ) : <></>
}

export default MemberRatingCard
