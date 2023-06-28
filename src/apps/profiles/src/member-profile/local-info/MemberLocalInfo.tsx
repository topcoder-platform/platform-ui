import { FC } from 'react'
import moment from 'moment-timezone'

import { useCountryName, UserProfile } from '~/libs/core'
import { IconSolid } from '~/libs/ui'

import styles from './MemberLocalInfo.module.scss'

interface MemberLocalInfoProps {
    profile: UserProfile | undefined
}

const MemberLocalInfo: FC<MemberLocalInfoProps> = (props: MemberLocalInfoProps) => {

    const memberCountry: string | undefined = useCountryName(props.profile?.homeCountryCode)

    return (
        <div className={styles.container}>
            <div className={styles.localInfo}>
                <IconSolid.LocationMarkerIcon />
                {memberCountry}
            </div>
            <div className={styles.localInfo}>
                <IconSolid.ClockIcon />
                Local time:
                {' '}
                {moment()
                    .tz('America/New_York')
                    .format('HH:MM')}
            </div>
        </div>
    )
}

export default MemberLocalInfo
