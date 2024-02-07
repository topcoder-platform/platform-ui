import { FC } from 'react'

import { UserProfile, UserStats } from '~/libs/core'

import { CommunityAwards } from '../../community-awards'
import { MemberStatsBlock } from '../../../components/tc-achievements/MemberStatsBlock'
import { TcSpecialRolesBanner } from '../../../components/tc-achievements/TcSpecialRolesBanner'
import { TCOWinsBanner } from '../../../components/tc-achievements/TCOWinsBanner'

import styles from './DefaultAchievementsView.module.scss'

interface DefaultAchievementsViewProps {
    memberStats: UserStats | undefined
    profile: UserProfile
    tcoWins: number
    tcoQualifications: number
    tcoTrips: number
}

const DefaultAchievementsView: FC<DefaultAchievementsViewProps> = props => (
    <>
        <p className='body-large-medium'>Achievements @ Topcoder</p>

        <div className={styles.achievementsWrap}>
            {(props.tcoWins > 0 || props.tcoQualifications > 0 || props.tcoTrips > 0) && (
                <TCOWinsBanner
                    tcoWins={props.tcoWins}
                    tcoQualifications={props.tcoQualifications}
                    tcoTrips={props.tcoTrips}
                />
            )}
            <MemberStatsBlock profile={props.profile} />
        </div>

        <TcSpecialRolesBanner memberStats={props.memberStats} />

        <CommunityAwards profile={props.profile} />
    </>
)

export default DefaultAchievementsView
