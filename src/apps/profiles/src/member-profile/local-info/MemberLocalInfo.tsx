import { FC, useMemo } from 'react'
import cityTimezones from 'city-timezones'
import moment from 'moment-timezone'

import { useCountryName, UserProfile } from '~/libs/core'
import { IconSolid } from '~/libs/ui'

import styles from './MemberLocalInfo.module.scss'

interface MemberLocalInfoProps {
    profile: UserProfile | undefined
}

const MemberLocalInfo: FC<MemberLocalInfoProps> = (props: MemberLocalInfoProps) => {

    const memberCountry: string | undefined
        = useCountryName(props.profile?.homeCountryCode || props.profile?.competitionCountryCode)

    const city: string | undefined = props.profile?.addresses?.[0]?.city

    const memberCityTimezone: string | undefined = useMemo(() => {
        if (!city) {
            return undefined
        }

        const cityTimezoneData: cityTimezones.CityData[] = cityTimezones.lookupViaCity(city)
        let memberTimezone: string | undefined

        if (!cityTimezoneData?.length) {
            memberTimezone = `${memberCountry}/${city}`
        } else {
            memberTimezone = cityTimezoneData[0].timezone
        }

        return moment.tz.zone(memberTimezone) ? memberTimezone : undefined
    }, [city, memberCountry])

    return (
        <div className={styles.container}>
            <div className={styles.localInfo}>
                <IconSolid.LocationMarkerIcon />
                {`${!!city ? `${city}, ` : ''}${memberCountry}`}
            </div>
            {
                !!memberCityTimezone && (
                    <div className={styles.localInfo}>
                        <IconSolid.ClockIcon />
                        Local time:
                        {' '}
                        {moment()
                            .tz(memberCityTimezone)
                            .format('hh:mm')}
                    </div>
                )
            }
        </div>
    )
}

export default MemberLocalInfo
