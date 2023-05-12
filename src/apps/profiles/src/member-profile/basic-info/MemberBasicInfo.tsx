import { FC } from "react"
import { UserProfile, UserStats } from "~/libs/core"
import moment from "moment"

import styles from './MemberBasicInfo.module.scss'


interface MemberBasicInfoProps {
    memberStats: UserStats | undefined
    profile: UserProfile | undefined
}

const MemberBasicInfo: FC<MemberBasicInfoProps> = (props: MemberBasicInfoProps) => {
    const { profile, memberStats } = props

    return (
        <div className={styles.container}>
            <p className={styles.memberSince}>
                Member Since
                {' '}
                {moment(profile?.createdAt).format('MMM YYYY')}
            </p>

            <h3>COMPETITION ACTIVITY</h3>
            <div className={styles.wins}>
                {memberStats?.wins || 0} Wins
            </div>
        </div>
    )
}

export default MemberBasicInfo