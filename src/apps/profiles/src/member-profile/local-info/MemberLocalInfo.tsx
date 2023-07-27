import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
import cityTimezones from 'city-timezones'
import moment from 'moment-timezone'

import { useCountryName, UserProfile } from '~/libs/core'
import { IconSolid } from '~/libs/ui'

import { EditMemberPropertyBtn } from '../../components'

import { ModifyLocationModal } from './ModifyLocationModal'
import styles from './MemberLocalInfo.module.scss'

interface MemberLocalInfoProps {
    profile: UserProfile
    authProfile: UserProfile | undefined
    refreshProfile: (handle: string) => void
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

    const canEdit: boolean = props.authProfile?.handle === props.profile.handle

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    function handleModifyLocationClick(): void {
        setIsEditMode(true)
    }

    function handleModifyLocationModalClose(): void {
        setIsEditMode(false)
    }

    function handleModifyLocationModalSave(): void {
        setTimeout(() => {
            setIsEditMode(false)
            props.refreshProfile(props.profile.handle)
        }, 1000)
    }

    return (
        <div className={styles.container}>
            <div className={styles.localInfo}>
                <IconSolid.LocationMarkerIcon />
                {`${!!city ? `${city}, ` : ''}${memberCountry}`}
                {
                    canEdit && (
                        <EditMemberPropertyBtn
                            onClick={handleModifyLocationClick}
                        />
                    )
                }
            </div>
            {
                !!memberCityTimezone && (
                    <div className={styles.localInfo}>
                        <IconSolid.ClockIcon />
                        Local time:
                        {' '}
                        {moment()
                            .tz(memberCityTimezone)
                            .format('hh:mm a z')
                            .toUpperCase()}
                    </div>
                )
            }

            {
                isEditMode && (
                    <ModifyLocationModal
                        onClose={handleModifyLocationModalClose}
                        onSave={handleModifyLocationModalSave}
                        profile={props.profile}
                    />
                )
            }
        </div>
    )
}

export default MemberLocalInfo
