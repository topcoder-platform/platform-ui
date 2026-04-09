/* eslint-disable complexity */
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
import { extractSkillsFromText, fetchSkillAutocompleteOptions } from '~/libs/shared'

import { TalentResultCard } from '../components/TalentResultCard'
import {
    MemberSearchPayload,
    MEMBER_SEARCH_LIMIT,
    PageWrapper,
    searchMembers,
    SearchTalent,
} from '../../../lib'
import personSearchImage from '../../../lib/assets/person-search.png'

import styles from './TalentSearchPage.module.scss'

export const TalentSearchPage: FC = () => {
    const skipNextAutoSearchRef = useRef<boolean>(false)
    const countryLookup: CountryLookup[] | undefined = useCountryLookup()
    const [jobDescription, setJobDescription] = useState<string>('')
    const [isExtractingSkills, setIsExtractingSkills] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [hasSearched, setHasSearched] = useState<boolean>(false)
    const [skillOptionsLoading, setSkillOptionsLoading] = useState<boolean>(false)
    const [selectedSkills, setSelectedSkills] = useState<InputMultiselectOption[]>([])
    const [selectedCountry, setSelectedCountry] = useState<string>('all')
    const [onlyOpenToWork, setOnlyOpenToWork] = useState<boolean>(true)
    const [onlyActive, setOnlyActive] = useState<boolean>(true)
    const [isSearchingMembers, setIsSearchingMembers] = useState<boolean>(false)
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
    const [results, setResults] = useState<SearchTalent[]>([])
    const [totalResults, setTotalResults] = useState<number>(0)
    const [currentPage, setCurrentPage] = useState<number>(1)

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
    const foundMembersCount = selectedCountry === 'all'
        ? (totalResults || filteredResults.length)
        : filteredResults.length
    const hasMoreResults = results.length < totalResults

    const loadSkillOptions = useCallback(async (query: string): Promise<InputMultiselectOption[]> => {
        setSkillOptionsLoading(true)
        try {
            return await fetchSkillAutocompleteOptions(query)
        } catch {
            return []
        } finally {
            setSkillOptionsLoading(false)
        }
    }, [])

    const runMemberSearch = useCallback(async (
        skillsToSearch: InputMultiselectOption[],
        overrides?: {
            append?: boolean
            openToWork?: boolean
            page?: number
            recentlyActive?: boolean
        },
    ): Promise<void> => {
        const append = overrides?.append === true
        const openToWork = overrides?.openToWork ?? onlyOpenToWork
        const page = overrides?.page ?? 1
        const recentlyActive = overrides?.recentlyActive ?? onlyActive

        const payload: MemberSearchPayload = {
            limit: MEMBER_SEARCH_LIMIT,
            openToWork,
            page,
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

        if (append) {
            setIsLoadingMore(true)
        } else {
            setIsSearchingMembers(true)
        }

        setErrorMessage('')

        try {
            const response = await searchMembers(payload)
            const fetchedData = Array.isArray(response?.data) ? response.data : []

            setResults(prevResults => {
                if (!append) {
                    return fetchedData
                }

                const seen = new Set(prevResults.map(item => item.id))
                const merged = [...prevResults]
                fetchedData.forEach(item => {
                    if (!seen.has(item.id)) {
                        seen.add(item.id)
                        merged.push(item)
                    }
                })

                return merged
            })
            setTotalResults(Number(response?.total || 0))
            setCurrentPage(Number(response?.page || page))
        } catch {
            if (!append) {
                setResults([])
                setTotalResults(0)
                setCurrentPage(1)
            }

            setErrorMessage('Failed to search matching members. Please try again.')
        } finally {
            if (append) {
                setIsLoadingMore(false)
            } else {
                setIsSearchingMembers(false)
            }
        }
    }, [onlyActive, onlyOpenToWork])

    const clearAllFilters = useCallback((): void => {
        const willTriggerAutoSearch = onlyOpenToWork !== true || onlyActive !== true

        setSelectedCountry('all')
        setOnlyOpenToWork(true)
        setOnlyActive(true)

        if (hasSearched && selectedSkills.length > 0) {
            // Prevent duplicate request only when toggles will trigger the search effect.
            if (willTriggerAutoSearch) {
                skipNextAutoSearchRef.current = true
            }

            runMemberSearch(selectedSkills, {
                openToWork: true,
                page: 1,
                recentlyActive: true,
            })
        }
    }, [hasSearched, onlyActive, onlyOpenToWork, runMemberSearch, selectedSkills])

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
                const skillId = String(skill.id ?? '')
                    .trim()
                const skillName = String(skill.name ?? '')
                    .trim()

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
            await runMemberSearch(extractedOptions, { page: 1 })
        } catch {
            // Prevent stale auto-search when extraction fails and loading flips to false.
            skipNextAutoSearchRef.current = true
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
        selectedSkills,
    ])

    const handleLoadMore = useCallback((): void => {
        if (isLoadingMore || isSearchingMembers || !hasMoreResults || selectedSkills.length === 0) {
            return
        }

        runMemberSearch(selectedSkills, {
            append: true,
            page: currentPage + 1,
        })
    }, [currentPage, hasMoreResults, isLoadingMore, isSearchingMembers, runMemberSearch, selectedSkills])

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
                                    className={styles.skillsMultiselect}
                                    label='Skills'
                                    name='skills'
                                    placeholder=''
                                    loading={skillOptionsLoading}
                                    onFetchOptions={loadSkillOptions}
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
                            <div className={styles.clearFiltersWrap}>
                                <Button secondary onClick={clearAllFilters}>
                                    Clear Filters
                                </Button>
                            </div>
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
                                <img
                                    src={personSearchImage}
                                    alt='Person search'
                                    className={styles.emptyIcon}
                                />
                                <p className={styles.emptyStateTitle}>Find the right talent</p>
                                <p className={styles.emptyStateDescription}>
                                    Paste a job description on the left and hit&nbsp;
                                    <span className={styles.emptyStateSearchText}>Search</span>
                                    &nbsp;- Our AI will match you with the
                                    best candidates from our network.
                                </p>
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
                                    <>
                                        <div className={styles.cardsGrid}>
                                            {filteredResults.map(talent => (
                                                <TalentResultCard
                                                    key={talent.id}
                                                    talent={talent}
                                                />
                                            ))}
                                        </div>
                                        {hasMoreResults && (
                                            <div className={styles.loadMoreWrap}>
                                                <Button
                                                    secondary
                                                    disabled={isLoadingMore}
                                                    onClick={handleLoadMore}
                                                >
                                                    {isLoadingMore ? 'Loading...' : 'Load More Members'}
                                                </Button>
                                            </div>
                                        )}
                                    </>
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
