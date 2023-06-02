import { FC } from 'react'
import moment from 'moment'

import { useCountryName, useMemberStats, UserProfile, UserStats } from '~/libs/core'

import styles from './MemberBasicInfo.module.scss'

interface MemberBasicInfoProps {
    profile: UserProfile | undefined
}

const MemberBasicInfo: FC<MemberBasicInfoProps> = (props: MemberBasicInfoProps) => {
    const memberStats: UserStats | undefined = useMemberStats(props.profile?.handle)

    const memberCountry: string | undefined = useCountryName(props.profile?.homeCountryCode)

    return (
        <div className={styles.container}>
            <div className={styles.location}>{memberCountry}</div>

            <p className={styles.memberSince}>
                Member Since
                {' '}
                {moment(props.profile?.createdAt)
                    .format('MMM YYYY')}
            </p>

            <h3>COMPETITION ACTIVITY</h3>
            <div className={styles.wins}>
                {memberStats?.wins || 0}
                {' '}
                Wins
            </div>
        </div>
    )
}

export default MemberBasicInfo
