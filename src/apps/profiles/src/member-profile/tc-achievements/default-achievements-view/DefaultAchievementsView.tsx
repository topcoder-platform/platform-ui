import { FC, useMemo } from 'react'
import classNames from 'classnames'

import { MemberRoleStats, UserProfile, UserStats } from '~/libs/core'

import { MemberChallengePointsBar, MemberStatsBlock } from '../../../components/tc-achievements/MemberStatsBlock'
import { TcSpecialRolesBanner } from '../../../components/tc-achievements/TcSpecialRolesBanner'
import { TCOWinsBanner } from '../../../components/tc-achievements/TCOWinsBanner'
import { getActiveTracks, MemberStatsTrack } from '../../../hooks'

import styles from './DefaultAchievementsView.module.scss'

interface DefaultAchievementsViewProps {
    memberStats: UserStats | undefined
    roleStats?: MemberRoleStats
    profile: UserProfile
    tcoWins: number
    tcoQualifications: number
    tcoTrips: number
}

const DefaultAchievementsView: FC<DefaultAchievementsViewProps> = props => {
    const hasTcoBanner = props.tcoWins > 0 || props.tcoQualifications > 0 || props.tcoTrips > 0
    const activeTracks: MemberStatsTrack[] = useMemo(() => getActiveTracks(props.memberStats), [props.memberStats])
    const hasMemberStats = activeTracks.length > 0
    const hasReviewer = !!props.roleStats?.reviewer?.challengeCount
    const hasCopilot = !!props.roleStats?.copilot?.challengeCount
    const hasRoles = hasReviewer || hasCopilot
    const hasTwoColumns = (hasReviewer && hasCopilot) || (hasTcoBanner && hasMemberStats)
    const hasAchievementsGrid = hasRoles || hasTcoBanner || hasMemberStats

    return (
        <>
            <p className='body-large-medium'>Achievements @ Topcoder</p>

            <MemberChallengePointsBar profile={props.profile} memberStats={props.memberStats} />

            {hasAchievementsGrid && (
                <div
                    className={classNames(styles.achievementsGrid, hasTwoColumns && styles.twoColumns)}
                >
                    <TcSpecialRolesBanner profile={props.profile} roleStats={props.roleStats} />
                    {hasTcoBanner && (
                        <div className={classNames(styles.tcoCell, hasMemberStats ? styles.col1 : styles.spanAll)}>
                            <TCOWinsBanner
                                tcoWins={props.tcoWins}
                                tcoQualifications={props.tcoQualifications}
                                tcoTrips={props.tcoTrips}
                            />
                        </div>
                    )}
                    {hasMemberStats && (
                        <div className={classNames(styles.statsCell, hasTcoBanner ? styles.col2 : styles.spanAll)}>
                            <MemberStatsBlock profile={props.profile} />
                        </div>
                    )}
                </div>
            )}

        </>
    )
}

export default DefaultAchievementsView
