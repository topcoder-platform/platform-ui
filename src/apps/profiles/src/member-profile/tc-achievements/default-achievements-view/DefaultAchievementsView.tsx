import { FC, useMemo } from 'react'

import { UserProfile, UserStats } from '~/libs/core'

import { MemberChallengePointsBar, MemberStatsBlock } from '../../../components/tc-achievements/MemberStatsBlock'
import { TcSpecialRolesBanner } from '../../../components/tc-achievements/TcSpecialRolesBanner'
import { TCOWinsBanner } from '../../../components/tc-achievements/TCOWinsBanner'
import { getActiveTracks, MemberStatsTrack } from '../../../hooks'

import styles from './DefaultAchievementsView.module.scss'

interface DefaultAchievementsViewProps {
    memberStats: UserStats | undefined
    profile: UserProfile
    tcoWins: number
    tcoQualifications: number
    tcoTrips: number
}

const DefaultAchievementsView: FC<DefaultAchievementsViewProps> = props => {
    const hasTcoBanner = props.tcoWins > 0 || props.tcoQualifications > 0 || props.tcoTrips > 0
    const activeTracks: MemberStatsTrack[] = useMemo(() => getActiveTracks(props.memberStats), [props.memberStats])
    const hasMemberStats = activeTracks.length > 0

    return (
        <>
            <p className='body-large-medium'>Achievements @ Topcoder</p>

            <MemberChallengePointsBar profile={props.profile} memberStats={props.memberStats} />

            {(hasTcoBanner || hasMemberStats) && (
                <div className={styles.achievementsWrap}>
                    {hasTcoBanner && (
                        <TCOWinsBanner
                            tcoWins={props.tcoWins}
                            tcoQualifications={props.tcoQualifications}
                            tcoTrips={props.tcoTrips}
                        />
                    )}
                    {hasMemberStats && <MemberStatsBlock profile={props.profile} />}
                </div>
            )}

            <TcSpecialRolesBanner memberStats={props.memberStats} />
        </>
    )
}

export default DefaultAchievementsView
