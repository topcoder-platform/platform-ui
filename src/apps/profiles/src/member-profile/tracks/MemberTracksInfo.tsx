import { FC } from "react"
import { UserProfile } from "~/libs/core"
import { TRACKS_PROFILE_MAP } from "../../config"

import styles from './MemberTracksInfo.module.scss'

interface MemberTracksInfoProps {
    profile: UserProfile | undefined
}

const MemberTracksInfo: FC<MemberTracksInfoProps> = (props: MemberTracksInfoProps) => {
    const { profile } = props
    const tracks = profile?.tracks || []

    return (
        <div className={styles.container}>
            {
                tracks.map(track => (
                    <div key={`${profile?.userId}-${track}`} className={styles.track}>
                        {TRACKS_PROFILE_MAP[track]}
                    </div>
                ))
            }
        </div>
    )
}

export default MemberTracksInfo
