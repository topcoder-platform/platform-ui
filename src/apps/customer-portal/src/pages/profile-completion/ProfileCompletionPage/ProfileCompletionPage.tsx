/* eslint-disable react/jsx-no-bind */
/* eslint-disable no-await-in-loop */
/* eslint-disable complexity */
import { ChangeEvent, FC, useEffect, useMemo, useState } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { CountryLookup, useCountryLookup, UserSkill, UserSkillDisplayModes } from '~/libs/core'
import { Button, InputSelect, InputSelectOption, LoadingSpinner, Tooltip } from '~/libs/ui'

import { PageWrapper } from '../../../lib'
import {
    CompletedProfilesResponse,
    DEFAULT_PAGE_SIZE,
    fetchCompletedProfiles,
    fetchMemberSkillsData,
} from '../../../lib/services/profileCompletion.service'

import styles from './ProfileCompletionPage.module.scss'

export const ProfileCompletionPage: FC = () => {
    const [selectedCountry, setSelectedCountry] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [memberSkills, setMemberSkills] = useState<Map<string | number, UserSkill[]>>(new Map())
    const countryLookup: CountryLookup[] | undefined = useCountryLookup()

    const countryCodeFilter = selectedCountry === 'all' ? undefined : selectedCountry

    const { data, error, isValidating }: SWRResponse<CompletedProfilesResponse> = useSWR(
        `customer-portal-completed-profiles:${countryCodeFilter || 'all'}:${currentPage}:${DEFAULT_PAGE_SIZE}`,
        () => fetchCompletedProfiles(countryCodeFilter, currentPage, DEFAULT_PAGE_SIZE),
        {
            revalidateOnFocus: false,
        },
    )

    // Fetch member skills for all profiles on the current page
    useEffect(() => {
        if (!data?.data || data.data.length === 0) return

        const fetchAllMemberSkills = async (): Promise<void> => {
            const skillsMap = new Map<string | number, UserSkill[]>()

            for (const profile of data.data) {
                if (profile.userId && !memberSkills.has(profile.userId)) {
                    const skills = await fetchMemberSkillsData(profile.userId)
                    skillsMap.set(profile.userId, skills)
                }
            }

            if (skillsMap.size > 0) {
                setMemberSkills(prevSkills => {
                    const newMap = new Map(prevSkills)
                    skillsMap.forEach((skills, userId) => {
                        newMap.set(userId, skills)
                    })
                    return newMap
                })
            }
        }

        fetchAllMemberSkills()
    }, [data?.data])

    const countryMap = useMemo(() => {
        const map = new Map<string, string>()
        const countries = countryLookup || []

        countries.forEach((country: CountryLookup) => {
            if (country.countryCode) {
                map.set(country.countryCode, country.country)
            }
        })

        return map
    }, [countryLookup])

    const countryOptions = useMemo<InputSelectOption[]>(() => {
        const staticOptions = (countryLookup || [])
            .filter(country => !!country.countryCode)
            .map(country => ({
                label: country.country,
                value: country.countryCode,
            }))
            .sort((a, b) => String(a.label)
                .localeCompare(String(b.label)))

        const seen = new Set<string>(staticOptions.map(option => option.value))
        const dynamicOptions = (data?.data || [])
            .filter(profile => !!profile.countryCode && !seen.has(String(profile.countryCode)))
            .map(profile => ({
                label: (
                    countryMap.get(String(profile.countryCode))
                    || profile.countryName
                    || String(profile.countryCode)
                ),
                value: String(profile.countryCode),
            }))
            .sort((a, b) => String(a.label)
                .localeCompare(String(b.label)))

        return [
            {
                label: 'All Countries',
                value: 'all',
            },
            ...staticOptions,
            ...dynamicOptions,
        ]
    }, [countryLookup, countryMap, data?.data])

    const profiles = data?.data || []
    const totalProfiles = data?.total || 0
    const totalPages = data?.totalPages || 1

    const displayedRows = useMemo(() => profiles
        .map(profile => {
            const userSkills = profile.userId ? (memberSkills.get(profile.userId) || []) : []

            // Prioritize principal skills, then add additional skills
            const allSkillsByPriority = [
                ...userSkills.filter(skill => skill.displayMode?.name === UserSkillDisplayModes.principal),
                ...userSkills.filter(skill => skill.displayMode?.name !== UserSkillDisplayModes.principal),
            ]

            const displayedSkills = allSkillsByPriority.slice(0, 5)
            const additionalSkillsCount = Math.max(0, allSkillsByPriority.length - 5)

            return {
                ...profile,
                countryLabel: profile.countryCode
                    ? countryMap.get(profile.countryCode) || profile.countryName || profile.countryCode
                    : profile.countryName || '-',
                fullName: [profile.firstName, profile.lastName].filter(Boolean)
                    .join(' ')
                    .trim(),
                locationLabel: [profile.city, profile.countryCode
                    ? countryMap.get(profile.countryCode) || profile.countryName || profile.countryCode
                    : profile.countryName]
                    .filter(Boolean)
                    .join(', '),
                displayedSkills,
                additionalSkillsCount,
            }
        })
        .sort((a, b) => a.handle.localeCompare(b.handle)), [profiles, countryMap, memberSkills])

    const isPreviousDisabled = currentPage <= 1 || isValidating
    const isNextDisabled = isValidating || currentPage >= totalPages

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
                            setCurrentPage(1)
                        }}
                        placeholder='Select country'
                    />
                </div>
                <div className={styles.counterCard}>
                    <span className={styles.counterLabel}>Fully Completed Profiles</span>
                    <strong className={styles.counterValue}>{totalProfiles}</strong>
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
                <>
                    <div className={styles.tableWrap}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Handle</th>
                                    <th>Location</th>
                                    <th>Skills</th>
                                    <th>Principal Skills</th>
                                    <th>Go to profile</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedRows.map(profile => (
                                    <tr key={profile.userId || profile.handle}>
                                        <td>
                                            <div className={styles.memberCell}>
                                                {profile.photoURL && (
                                                    <img
                                                        src={profile.photoURL}
                                                        alt={profile.handle}
                                                        className={styles.avatar}
                                                    />
                                                )}
                                                <span>{profile.fullName || '-'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <a
                                                href={`${EnvironmentConfig.USER_PROFILE_URL}/${profile.handle}`}
                                                target='_blank'
                                                rel='noreferrer noopener'
                                            >
                                                {profile.handle}
                                            </a>
                                        </td>
                                        <td>{profile.locationLabel || profile.countryLabel}</td>
                                        <td>{profile.skillCount ?? '-'}</td>
                                        <td>
                                            {profile.displayedSkills && profile.displayedSkills.length > 0 ? (
                                                <div className={styles.skillsList}>
                                                    {profile.displayedSkills.map(skill => (
                                                        <span key={skill.id} className={styles.skillTag}>
                                                            {skill.name}
                                                        </span>
                                                    ))}
                                                    {profile.additionalSkillsCount > 0 && (
                                                        <Tooltip
                                                            content={`${profile.additionalSkillsCount} more skill${profile.additionalSkillsCount === 1 ? '' : 's'}`}
                                                        >
                                                            <span className={styles.moreIndicator}>
                                                                +
                                                            </span>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td>
                                            <a
                                                href={`${EnvironmentConfig.USER_PROFILE_URL}/${profile.handle}`}
                                                target='_blank'
                                                rel='noreferrer noopener'
                                            >
                                                Go to profile
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.paginationRow}>
                        <span className={styles.paginationInfo}>
                            Page
                            {' '}
                            {currentPage}
                            {' '}
                            of
                            {' '}
                            {totalPages}
                        </span>
                        <div className={styles.paginationButtons}>
                            <Button
                                secondary
                                noCaps
                                disabled={isPreviousDisabled}
                                onClick={() => setCurrentPage(previousPage => Math.max(previousPage - 1, 1))}
                            >
                                Previous
                            </Button>
                            <Button
                                secondary
                                noCaps
                                disabled={isNextDisabled}
                                onClick={() => setCurrentPage(previousPage => Math.min(previousPage + 1, totalPages))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </PageWrapper>
    )
}

export default ProfileCompletionPage
