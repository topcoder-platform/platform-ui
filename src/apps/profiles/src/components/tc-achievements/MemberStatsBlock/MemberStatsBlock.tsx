import { FC } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { UserProfile } from '~/libs/core'
import { IconOutline } from '~/libs/ui'

import { useFetchActiveTracks } from '../../../hooks'
import { WinnerIcon } from '../../../lib'
import { MemberProfileContextValue, useMemberProfileContext } from '../../../member-profile/MemberProfile.context'

import styles from './MemberStatsBlock.module.scss'

interface MemberStatsBlockProps {
    profile: UserProfile
}

const MemberStatsBlock: FC<MemberStatsBlockProps> = props => {
    const { statsRoute }: MemberProfileContextValue = useMemberProfileContext()

    const activeTracks = useFetchActiveTracks(props.profile.handle)

    return activeTracks?.length === 0 ? <></> : (
        <div className={styles.containerWrap}>
            <div className={styles.container}>
                <div className={styles.innerWrapper}>
                    <p className={styles.sectionTitle}>
                        <span className='body-large-bold'>
                            Member Stats
                        </span>
                    </p>
                    <ul className={styles.statsList}>
                        {activeTracks.map((track: any) => (
                            <Link
                                to={statsRoute(props.profile.handle, track.name)}
                                className={styles.trackListItem}
                                key={track.name}
                            >
                                <span className={styles.trackName}>{track.name}</span>
                                <div className={styles.trackDetails}>
                                    {!track.isDSTrack && ((track.submissions || track.wins) > 0) && (
                                        <>
                                            <WinnerIcon className={classNames('icon-xxxl', styles.winnerIcon)} />
                                            <span className={styles.trackStats}>
                                                <span className={styles.count}>
                                                    {track.wins || track.submissions}
                                                </span>
                                                <span className={styles.label}>
                                                    {track.wins > 0 ? 'Wins' : 'Submissions'}
                                                </span>
                                            </span>
                                        </>
                                    )}
                                    {/* competitive programming only */}
                                    {track.isDSTrack && (
                                        <span className={styles.trackStats}>
                                            <span className={styles.count}>
                                                {track.percentile}
                                                %
                                            </span>
                                            <span className={styles.label}>
                                                Percentile
                                            </span>
                                        </span>
                                    )}
                                    <IconOutline.ChevronRightIcon
                                        className={classNames('icon-lg', styles.rightArrowIcon)}
                                    />
                                </div>
                            </Link>
                        ))}
                    </ul>
                    <p className={styles.footerNote}>
                        <span className='body-main'>
                            Topcoder challenges are competitive events where community members collaborate
                            on smaller tasks to complete a project,
                            striving to showcase their skills and outperform others.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default MemberStatsBlock
