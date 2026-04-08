/* eslint-disable react/jsx-no-bind */
import { ChangeEvent, FC, FocusEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'

import { CountryLookup, useCountryLookup } from '~/libs/core'
import {
    Button,
    IconOutline,
    InputMultiselect,
    InputMultiselectOption,
    InputSelect,
    InputSelectOption,
    InputTextarea,
    Tooltip,
} from '~/libs/ui'
import { extractSkillsFromText } from '~/libs/shared'

import {
    MemberSearchPayload,
    MEMBER_SEARCH_LIMIT,
    PageWrapper,
    searchMembers,
    SearchTalent,
} from '../../../lib'
import { TalentResultCard } from '../components/TalentResultCard'

import styles from './TalentSearchPage.module.scss'

export const TalentSearchPage: FC = () => {
    const skipNextAutoSearchRef = useRef<boolean>(false)
    const countryLookup: CountryLookup[] | undefined = useCountryLookup()
    const [jobDescription, setJobDescription] = useState<string>('')
    const [isExtractingSkills, setIsExtractingSkills] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [hasSearched, setHasSearched] = useState<boolean>(false)
    const [selectedSkills, setSelectedSkills] = useState<InputMultiselectOption[]>([])
    const [selectedCountry, setSelectedCountry] = useState<string>('all')
    const [onlyOpenToWork, setOnlyOpenToWork] = useState<boolean>(true)
    const [onlyActive, setOnlyActive] = useState<boolean>(true)
    const [isSearchingMembers, setIsSearchingMembers] = useState<boolean>(false)
    const [results, setResults] = useState<SearchTalent[]>([])
    const [totalResults, setTotalResults] = useState<number>(0)

    // const breadCrumb = useMemo(
    //     () => [{ index: 1, label: 'Talent Search' }],
    //     [],
    // )
    const countryOptions = useMemo(
        (): InputSelectOption[] => [
            { label: 'All Countries', value: 'all' },
            ...((countryLookup || [])
                .map(country => ({
                    label: country.country,
                    value: country.countryCode,
                }))
                .filter(option => option.label && option.value)
                .sort((a, b) => String(a.label)
                    .localeCompare(String(b.label)))),
        ],
        [countryLookup],
    )

    const filteredResults = useMemo(() => results.filter(talent => {
        if (selectedCountry !== 'all') {
            const selectedCountryOption = countryOptions.find(option => option.value === selectedCountry)
            const selectedCountryName = typeof selectedCountryOption?.label === 'string'
                ? selectedCountryOption.label
                : ''
            const normalizedLocation = talent.location.toLowerCase()

            if (!selectedCountryName || !normalizedLocation.includes(selectedCountryName.toLowerCase())) {
                return false
            }
        }

        if (onlyActive && !talent.isRecentlyActive) {
            return false
        }

        return true
    }), [countryOptions, onlyActive, results, selectedCountry])
    const foundMembersCount = totalResults || filteredResults.length

    const runMemberSearch = useCallback(async (
        skillsToSearch: InputMultiselectOption[],
        overrides?: { openToWork?: boolean; recentlyActive?: boolean },
    ): Promise<void> => {
        const openToWork = overrides?.openToWork ?? onlyOpenToWork
        const recentlyActive = overrides?.recentlyActive ?? onlyActive

        const payload: MemberSearchPayload = {
            limit: MEMBER_SEARCH_LIMIT,
            openToWork,
            page: 1,
            recentlyActive,
            skills: skillsToSearch
                .map(skill => String(skill.value || '')
                    .trim())
                .filter(Boolean)
                .map(skillId => ({
                    id: skillId,
                    wins: 1,
                })),
            skillSearchType: 'OR',
            verifiedProfile: true,
        }

        setIsSearchingMembers(true)
        setErrorMessage('')

        try {
            const response = await searchMembers(payload)

            setResults(Array.isArray(response?.data) ? response.data : [])
            setTotalResults(Number(response?.total || 0))
        } catch {
            setResults([])
            setTotalResults(0)
            setErrorMessage('Failed to search matching members. Please try again.')
        } finally {
            setIsSearchingMembers(false)
        }
    }, [onlyActive, onlyOpenToWork])

    const clearAllFilters = useCallback((): void => {
        setSelectedCountry('all')
        setOnlyOpenToWork(true)
        setOnlyActive(true)

        if (hasSearched && selectedSkills.length > 0) {
            runMemberSearch(selectedSkills, {
                openToWork: true,
                recentlyActive: true,
            })
        }
    }, [hasSearched, runMemberSearch, selectedSkills])

    const handleAiSearch = useCallback(async (): Promise<void> => {
        const normalizedDescription = jobDescription.trim()
        if (!normalizedDescription || isExtractingSkills) {
            return
        }

        setErrorMessage('')
        setIsExtractingSkills(true)

        try {
            const extractedSkillsResult = await extractSkillsFromText(normalizedDescription)
            const extractedSkills = Array.isArray(extractedSkillsResult?.matches)
                ? extractedSkillsResult.matches
                : []
            const skillById = new Map<string, InputMultiselectOption>()

            extractedSkills.forEach((skill: { id?: unknown; name?: unknown }) => {
                const skillId = typeof skill.id === 'string' ? skill.id.trim() : ''
                const skillName = typeof skill.name === 'string' ? skill.name.trim() : ''

                if (!skillId || !skillName) {
                    return
                }

                skillById.set(skillId, {
                    label: skillName,
                    value: skillId,
                })
            })

            const extractedOptions = Array.from(skillById.values())
            setSelectedSkills(extractedOptions)

            if (extractedOptions.length === 0) {
                setResults([])
                setTotalResults(0)
                setHasSearched(true)
                setErrorMessage('No skills were extracted from the job description.')
                return
            }

            setHasSearched(true)
            skipNextAutoSearchRef.current = true
            await runMemberSearch(extractedOptions)
        } catch {
            setErrorMessage('Failed to extract skills. Please try again.')
            setHasSearched(true)
        } finally {
            setIsExtractingSkills(false)
        }
    }, [isExtractingSkills, jobDescription, runMemberSearch])

    useEffect(() => {
        if (!hasSearched || isExtractingSkills || selectedSkills.length === 0) {
            return
        }

        if (skipNextAutoSearchRef.current) {
            skipNextAutoSearchRef.current = false
            return
        }

        runMemberSearch(selectedSkills)
    }, [
        hasSearched,
        isExtractingSkills,
        onlyActive,
        onlyOpenToWork,
        runMemberSearch,
        selectedCountry,
        selectedSkills,
    ])

    return (
        <PageWrapper
            pageTitle='Talent Search'
            className={classNames(styles.container)}
            breadCrumb={[]}
        >
            <div className={styles.pageArea}>
                <div className={styles.pageHero} />
                <div className={styles.pageBody}>
                    <aside className={styles.sidebar}>
                        <section className={styles.panel}>
                            <div className={styles.searchTabs}>
                                <button
                                    type='button'
                                    className={classNames(styles.tabButton, styles.activeTab)}
                                >
                                    AI Search
                                </button>
                            </div>
                            <InputTextarea
                                classNameWrapper={styles.jobDescriptionField}
                                label='Job Description'
                                name='jobDescription'
                                value={jobDescription}
                                rows={12}
                                onChange={(event: FocusEvent<HTMLTextAreaElement>) => {
                                    setJobDescription(event.target.value)
                                }}
                            />
                            <div className={styles.aiActions}>
                                <Button
                                    secondary
                                    disabled={isExtractingSkills}
                                    onClick={() => {
                                        setJobDescription('')
                                        setErrorMessage('')
                                    }}
                                >
                                    Clear
                                </Button>
                                <Button
                                    primary
                                    disabled={isExtractingSkills || !jobDescription.trim()}
                                    onClick={handleAiSearch}
                                >
                                    {isExtractingSkills ? 'Analyzing...' : 'Search'}
                                </Button>
                            </div>
                            {errorMessage && (
                                <p className={styles.errorMessage}>{errorMessage}</p>
                            )}
                        </section>

                        <section className={styles.panel}>
                            <p className={styles.panelTitle}>Filter</p>
                            <div className={styles.filterBlock}>
                                <InputMultiselect
                                    label='Skills'
                                    name='skills'
                                    disabled={!hasSearched}
                                    value={selectedSkills}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        const value = (event.target.value || []) as InputMultiselectOption[]
                                        setSelectedSkills(value)
                                    }}
                                />
                            </div>
                            <div className={styles.filterBlock}>
                                <InputSelect
                                    label='Country'
                                    name='country'
                                    options={countryOptions}
                                    value={selectedCountry}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        setSelectedCountry(event.target.value || 'all')
                                    }}
                                    placeholder='Select country'
                                />
                            </div>
                            <label className={styles.checkboxRow}>
                                <input
                                    type='checkbox'
                                    checked={onlyOpenToWork}
                                    className={styles.checkboxInput}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        setOnlyOpenToWork(event.target.checked)
                                    }}
                                />
                                <span className={styles.toggleControl} />
                                <span>Open to work</span>
                            </label>
                            <label className={styles.checkboxRow}>
                                <input
                                    type='checkbox'
                                    checked={onlyActive}
                                    className={styles.checkboxInput}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        setOnlyActive(event.target.checked)
                                    }}
                                />
                                <span className={styles.toggleControl} />
                                <span className={styles.checkboxLabelWithInfo}>
                                    <span>Active members</span>
                                    <Tooltip
                                        content={(
                                            'This member has participated in a challenge, task, '
                                            + 'or engagement in the past 1 year.'
                                        )}
                                        place='top'
                                    >
                                        <button
                                            type='button'
                                            className={styles.infoIconButton}
                                            aria-label='Only active members info'
                                        >
                                            <IconOutline.InformationCircleIcon />
                                        </button>
                                    </Tooltip>
                                </span>
                            </label>
                            <Button secondary onClick={clearAllFilters}>
                                Clear Filters
                            </Button>
                        </section>
                    </aside>

                    <section
                        className={classNames(
                            styles.resultsPanel,
                            !hasSearched && styles.resultsPanelEmpty,
                        )}
                    >
                        {!hasSearched && (
                            <div className={styles.emptyState}>
                                <IconOutline.SearchIcon className={styles.emptyIcon} />
                                <h4>Find the right talent</h4>
                                <p>Paste a job description on the left and hit Search.</p>
                                <p>Our AI will match you with the best candidates from our network.</p>
                            </div>
                        )}

                        {hasSearched && (
                            <div className={styles.resultsContent}>
                                <div className={styles.resultsTop}>
                                    <p className={styles.foundText}>
                                        We found&nbsp;
                                        <span className={styles.foundTextCount}>
                                            {`${foundMembersCount} members`}
                                        </span>
                                        &nbsp;that match your filters
                                    </p>
                                    <div className={styles.sortControl}>
                                        <span className={styles.sortLabel}>Sort by</span>
                                        <InputSelect
                                            classNameWrapper={styles.matchingIndexSelect}
                                            name='sortBy'
                                            options={[
                                                { label: 'Matching Index', value: 'matching-index' },
                                            ]}
                                            value='matching-index'
                                            onChange={() => undefined}
                                        />
                                    </div>
                                </div>
                                {isSearchingMembers && (
                                    <div className={styles.emptyState}>
                                        <h4>Searching talent...</h4>
                                    </div>
                                )}
                                {!isSearchingMembers && filteredResults.length === 0 && (
                                    <div className={styles.emptyState}>
                                        <h4>No matching talent found</h4>
                                        <p>Try changing filters or using a different job description.</p>
                                    </div>
                                )}
                                {!isSearchingMembers && filteredResults.length > 0 && (
                                    <div className={styles.cardsGrid}>
                                        {filteredResults.map(talent => (
                                            <TalentResultCard
                                                key={talent.id}
                                                talent={talent}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </PageWrapper>
    )
}

export default TalentSearchPage
