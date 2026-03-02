import { Dispatch, FC, SetStateAction, useContext, useMemo, useState } from 'react'
import { trim } from 'lodash'
import cityTimezones from 'city-timezones'
import moment from 'moment-timezone'

import { profileContext, ProfileContextData, useCountryName, UserProfile, UserRole } from '~/libs/core'
import { IconOutline, IconSolid, Tooltip } from '~/libs/ui'

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

    const address = props.profile?.addresses?.[0]

    const city: string | undefined = address?.city

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

    const { profile }: ProfileContextData = useContext(profileContext)
    const isAdminOrTM = profile?.roles?.includes(UserRole.administrator)
    || profile?.roles?.includes(UserRole.talentManager)

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

    const locationDisplay: string = useMemo(() => {
        if (city && memberCountry) {
            return `${city}, ${memberCountry}`
        }

        if (city) {
            return city
        }

        if (memberCountry) {
            return memberCountry
        }

        return 'Unknown location'
    }, [city, memberCountry])

    const hasDetailedAddress: boolean = useMemo(() => {
        if (!address) return false
        return !!(
            trim(address.streetAddr1)
      || trim(address.streetAddr2)
      || trim(address.stateCode)
      || trim(address.zip)
        )
    }, [address])

    const canSeeDetailedAddressIcon = canEdit || isAdminOrTM

    const tooltipContent = useMemo(() => {
        if (!hasDetailedAddress) return undefined

        const addressLine = [
            trim(address?.streetAddr1),
            trim(address?.streetAddr2),
            trim(address?.city),
            trim(address?.stateCode),
        ].filter(Boolean)
            .join(', ')

        const postalCode = trim(address?.zip)

        if (!postalCode) return addressLine

        return (
            <>
                <div>{addressLine}</div>
                <div>
                    Zip/Postal code -
                    {postalCode}
                </div>
            </>
        )
    }, [address, hasDetailedAddress])

    return (
        <div className={styles.container}>
            <div className={styles.localInfo}>
                <IconSolid.LocationMarkerIcon />
                {locationDisplay}
                {hasDetailedAddress && canSeeDetailedAddressIcon && (
                    <div className={styles.tooltip}>
                        <Tooltip content={tooltipContent} triggerOn='hover'>
                            <IconOutline.InformationCircleIcon className='tooltip-icon' />
                        </Tooltip>
                    </div>
                )}
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
