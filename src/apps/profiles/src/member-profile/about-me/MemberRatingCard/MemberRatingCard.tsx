/* eslint-disable jsx-a11y/anchor-is-valid */
import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
import classNames from 'classnames'

import { useMemberStats, UserProfile, UserStats } from '~/libs/core'

import { MemberRatingInfoModal } from './MemberRatingInfoModal'
import styles from './MemberRatingCard.module.scss'

interface MemberRatingCardProps {
    profile: UserProfile
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

    return memberStats?.maxRating?.rating ? (
        <div className={styles.container}>
            <div className={styles.innerWrap}>
                <div className={classNames(styles.valueWrap, !maxPercentile ? styles.noPercentile : '')}>
                    <p className={styles.value}>{memberStats?.maxRating?.rating}</p>
                    <p className={styles.name}>Rating</p>
                </div>
                {
                    maxPercentile ? (
                        <div className={styles.valueWrap}>
                            <p className={styles.value}>
                                {Number(maxPercentile)
                                    .toFixed(2)}
                            </p>
                            <p className={styles.name}>Percentile</p>
                        </div>
                    ) : undefined
                }
                <div className='body-small-medium'>
                    <button type='button' className={styles.link} onClick={handleInfoModalOpen}>What is this?</button>
                </div>
            </div>

            {
                isInfoModalOpen && (
                    <MemberRatingInfoModal
                        onClose={handleInfoModalClose}
                    />
                )
            }
        </div>
    ) : <></>
}

export default MemberRatingCard
