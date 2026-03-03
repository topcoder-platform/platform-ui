import { ChangeEvent, FC, useMemo, useState } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { CountryLookup, useCountryLookup, xhrGetAsync } from '~/libs/core'
import { InputSelect, InputSelectOption, LoadingSpinner } from '~/libs/ui'

import { PageWrapper } from '../../../lib'

import styles from './ProfileCompletionPage.module.scss'

type CompletedProfile = {
    countryCode?: string
    countryName?: string
    handle: string
    userId?: number | string
}

function normalizeToList(raw: any): any[] {
    if (Array.isArray(raw)) {
        return raw
    }

    if (Array.isArray(raw?.data)) {
        return raw.data
    }

    if (Array.isArray(raw?.result?.content)) {
        return raw.result.content
    }

    if (Array.isArray(raw?.result)) {
        return raw.result
    }

    return []
}

async function fetchCompletedProfiles(): Promise<CompletedProfile[]> {
    const response = await xhrGetAsync<CompletedProfile[]>(
        `${EnvironmentConfig.REPORTS_API}/topcoder/completed-profiles`,
    )

    return normalizeToList(response)
}

export const ProfileCompletionPage: FC = () => {
    const [selectedCountry, setSelectedCountry] = useState<string>('all')
    const countryLookup: CountryLookup[] | undefined = useCountryLookup()

    const { data, error, isValidating }: SWRResponse<CompletedProfile[]> = useSWR(
        'customer-portal-completed-profiles',
        fetchCompletedProfiles,
        {
            revalidateOnFocus: false,
        },
    )

    const countryMap = useMemo(() => {
        const map = new Map<string, string>()
        ;(countryLookup || []).forEach(country => {
            if (country.countryCode) {
                map.set(country.countryCode, country.country)
            }
        })

        return map
    }, [countryLookup])

    const countryOptions = useMemo<InputSelectOption[]>(() => {
        const dynamicCodes = new Set<string>()
        ;(data || []).forEach(profile => {
            if (profile.countryCode) {
                dynamicCodes.add(profile.countryCode)
            }
        })

        const dynamicOptions = Array.from(dynamicCodes)
            .map(code => ({
                label: countryMap.get(code) || code,
                value: code,
            }))
            .sort((a, b) => String(a.label).localeCompare(String(b.label)))

        return [
            {
                label: 'All Countries',
                value: 'all',
            },
            ...dynamicOptions,
        ]
    }, [countryMap, data])

    const profiles = useMemo(() => {
        const source = data || []
        if (selectedCountry === 'all') {
            return source
        }

        return source.filter(profile => profile.countryCode === selectedCountry)
    }, [data, selectedCountry])

    const displayedRows = useMemo(() => profiles
        .map(profile => ({
            ...profile,
            countryLabel: profile.countryCode
                ? countryMap.get(profile.countryCode) || profile.countryName || profile.countryCode
                : profile.countryName || '-',
        }))
        .sort((a, b) => a.handle.localeCompare(b.handle)), [profiles, countryMap])

    return (
        <PageWrapper
            pageTitle='Profile Completion'
            breadCrumb={[]}
            className={styles.container}
        >
            <div className={styles.headerRow}>
                <div className={styles.filterWrap}>
                    <InputSelect
                        name='country'
                        label='Country'
                        options={countryOptions}
                        value={selectedCountry}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            setSelectedCountry(event.target.value || 'all')
                        }}
                        placeholder='Select country'
                    />
                </div>
                <div className={styles.counterCard}>
                    <span className={styles.counterLabel}>Fully Completed Profiles</span>
                    <strong className={styles.counterValue}>{profiles.length}</strong>
                </div>
            </div>

            {isValidating && !data && (
                <div className={styles.loadingWrap}>
                    <LoadingSpinner className={styles.spinner} />
                </div>
            )}

            {!isValidating && !!error && (
                <div className={styles.errorMessage}>
                    Failed to load profile completion data.
                </div>
            )}

            {!error && !isValidating && displayedRows.length === 0 && (
                <div className={styles.emptyMessage}>
                    No fully completed profiles found for the selected country.
                </div>
            )}

            {!error && displayedRows.length > 0 && (
                <div className={styles.tableWrap}>
                    <table>
                        <thead>
                            <tr>
                                <th>Handle</th>
                                <th>Country</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedRows.map(profile => (
                                <tr key={profile.userId || profile.handle}>
                                    <td>
                                        <a href={`${EnvironmentConfig.USER_PROFILE_URL}/${profile.handle}`} target='_blank' rel='noreferrer noopener'>{profile.handle}</a>
                                    </td>
                                    <td>{profile.countryLabel}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </PageWrapper>
    )
}

export default ProfileCompletionPage
