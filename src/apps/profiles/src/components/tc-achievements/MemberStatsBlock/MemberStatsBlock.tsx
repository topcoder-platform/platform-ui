import { FC } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { UserProfile } from '~/libs/core'
import { IconOutline } from '~/libs/ui'

import { useFetchActiveTracks } from '../../../hooks'
import { getUserProfileStatsRoute } from '../../../profiles.routes'
import { WinnerIcon } from '../../../lib'

import styles from './MemberStatsBlock.module.scss'

interface MemberStatsBlockProps {
    profile: UserProfile
}

const MemberStatsBlock: FC<MemberStatsBlockProps> = props => {
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
                                to={getUserProfileStatsRoute(props.profile.handle, track.name)}
                                className={styles.trackListItem}
                                key={track.name}
                            >
                                <span className={styles.trackName}>{track.name}</span>
                                <div className={styles.trackDetails}>
                                    {!track.ranking && ((track.submissions || track.wins) > 0) && (
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
                                    {track.ranking !== undefined && (
                                        <span className={styles.trackStats}>
                                            <span className={styles.count}>
                                                {track.ranking}
                                                %
                                            </span>
                                            <span className={styles.label}>
                                                Ranking
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
                        <span className='body-main-medium'>
                            Topcoder challenges are open competitions where community
                            members participate in small units of work to deliver projects.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default MemberStatsBlock
