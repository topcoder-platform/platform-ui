/* eslint-disable jsx-a11y/anchor-is-valid */
import { FC, useMemo } from 'react'

import { useMemberStats, UserProfile, UserStats } from '~/libs/core'

import styles from './MemberRatingCard.module.scss'

interface MemberRatingCardProps {
    profile: UserProfile
}

const MemberRatingCard: FC<MemberRatingCardProps> = (props: MemberRatingCardProps) => {
    const memberStats: UserStats | undefined = useMemberStats(props.profile.handle)

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

    return memberStats?.maxRating?.rating ? (
        <div className={styles.container}>
            <div className={styles.innerWrap}>
                <div className={styles.valueWrap}>
                    <p className={styles.value}>{memberStats?.maxRating?.rating}</p>
                    <p className={styles.name}>Rating</p>
                </div>
                <div className={styles.valueWrap}>
                    <p className={styles.value}>
                        {Number(maxPercentile)
                            .toFixed(2)}
                    </p>
                    <p className={styles.name}>Percentile</p>
                </div>
                <div className='body-small-medium'>
                    <a href='#' className={styles.link}>What is this?</a>
                </div>
            </div>
        </div>
    ) : <></>
}

export default MemberRatingCard
