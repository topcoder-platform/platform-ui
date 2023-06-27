import { FC } from 'react'

import { TC_TRACKS, UserProfile } from '~/libs/core'

import { TRACKS_PROFILE_MAP } from '../../config'

import styles from './MemberTracksInfo.module.scss'

interface MemberTracksInfoProps {
    profile: UserProfile | undefined
}

const MemberTracksInfo: FC<MemberTracksInfoProps> = (props: MemberTracksInfoProps) => {
    const tracks: Array<TC_TRACKS> = props.profile?.tracks || []

    return (
        <div className={styles.container}>
            <h3>My Tracks</h3>

            <div className={styles.tracksWrap}>
                {
                    tracks.map(track => (
                        <div key={`${props.profile?.userId}-${track}`} className={styles.track}>
                            {TRACKS_PROFILE_MAP[track]}
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default MemberTracksInfo
