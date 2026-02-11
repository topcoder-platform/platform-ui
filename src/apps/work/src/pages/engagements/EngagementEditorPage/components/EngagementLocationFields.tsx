import {
    FC,
    useMemo,
} from 'react'
import moment from 'moment-timezone'

import {
    FormSelectField,
    FormSelectOption,
} from '../../../../lib/components/form'

interface EngagementLocationFieldsProps {
    disabled?: boolean
}

function formatTimezoneLabel(timezone: string): string {
    const now = new Date()

    const localized = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        timeZone: timezone,
    })

    const utc = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        timeZone: 'UTC',
    })

    const [localHour, localMinute] = localized.split(':')
        .map(value => Number(value))
    const [utcHour, utcMinute] = utc.split(':')
        .map(value => Number(value))

    const localTotal = (localHour * 60) + localMinute
    const utcTotal = (utcHour * 60) + utcMinute

    let difference = localTotal - utcTotal

    if (difference > 720) {
        difference -= 1440
    }

    if (difference < -720) {
        difference += 1440
    }

    const sign = difference >= 0 ? '+' : '-'
    const absoluteDifference = Math.abs(difference)
    const offsetHours = String(Math.floor(absoluteDifference / 60))
        .padStart(2, '0')
    const offsetMinutes = String(absoluteDifference % 60)
        .padStart(2, '0')

    return `(UTC${sign}${offsetHours}:${offsetMinutes}) ${timezone}`
}

function getTimezoneOptions(): FormSelectOption[] {
    return moment.tz.names()
        .map(timezone => ({
            label: formatTimezoneLabel(timezone),
            value: timezone,
        }))
}

function getCountryOptions(): FormSelectOption[] {
    const displayNames = typeof Intl !== 'undefined' && Intl.DisplayNames
        ? new Intl.DisplayNames(['en'], { type: 'region' })
        : undefined

    const options = moment.tz.countries()
        .map(countryCode => ({
            label: displayNames?.of(countryCode) || countryCode,
            value: countryCode,
        }))

    return options.sort((optionA, optionB) => optionA.label.localeCompare(optionB.label))
}

export const EngagementLocationFields: FC<EngagementLocationFieldsProps> = (
    props: EngagementLocationFieldsProps,
) => {
    const timezoneOptions = useMemo(() => getTimezoneOptions(), [])
    const countryOptions = useMemo(() => getCountryOptions(), [])

    return (
        <>
            <FormSelectField
                disabled={props.disabled}
                isMulti
                label='Timezones'
                name='timezones'
                options={timezoneOptions}
                placeholder='Select timezones'
                required
            />

            <FormSelectField
                disabled={props.disabled}
                isMulti
                label='Countries'
                name='countries'
                options={countryOptions}
                placeholder='Select countries'
                required
            />
        </>
    )
}

export default EngagementLocationFields
