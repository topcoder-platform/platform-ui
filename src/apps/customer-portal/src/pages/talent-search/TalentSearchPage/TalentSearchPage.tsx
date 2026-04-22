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

type TalentSearchSortOption = 'alphabetical' | 'matching-index'

export const TalentSearchPage: FC = () => {
    const skipNextAutoSearchRef = useRef<boolean>(false)
    const searchGenerationRef = useRef<number>(0) // ← add this

    const [lastSearchedDescription, setLastSearchedDescription] = useState<string>('')
    const countryLookup: CountryLookup[] | undefined = useCountryLookup()
    const [jobDescription, setJobDescription] = useState<string>('')
    const [isExtractingSkills, setIsExtractingSkills] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [hasSearched, setHasSearched] = useState<boolean>(true)
    const [skillOptionsLoading, setSkillOptionsLoading] = useState<boolean>(false)
    const [selectedSkills, setSelectedSkills] = useState<InputMultiselectOption[]>([])
    const [sortBy, setSortBy] = useState<TalentSearchSortOption>('alphabetical')
    const [selectedCountries, setSelectedCountries] = useState<InputMultiselectOption[]>([])
    const [onlyOpenToWork, setOnlyOpenToWork] = useState<boolean>(false)
    const [onlyActive, setOnlyActive] = useState<boolean>(false)
    const [isSearchingMembers, setIsSearchingMembers] = useState<boolean>(true)
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
    const [results, setResults] = useState<SearchTalent[]>([])
    const [totalResults, setTotalResults] = useState<number>(0)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const countryNameByCode = useMemo((): Map<string, string> => new Map(
        (countryLookup || [])
            .filter(country => country.countryCode && country.country)
            .map(country => [country.countryCode.toUpperCase(), country.country]),
    ), [countryLookup])
    const countryFilterOptions = useMemo(
        (): InputMultiselectOption[] => (countryLookup || [])
            .map(country => ({
                label: country.country,
                value: country.countryCode,
            }))
            .filter(option => option.label && option.value)
            .sort((a, b) => String(a.label)
                .localeCompare(String(b.label))),
        [countryLookup],
    )
    const selectedCountryCodesList = useMemo(
        (): string[] => selectedCountries
            .map(country => String(country.value || '')
                .trim()
                .toUpperCase())
            .filter(Boolean),
        [selectedCountries],
    )

    const hasSkillSearch = selectedSkills.length > 0
    const activeSort: TalentSearchSortOption = hasSkillSearch ? 'matching-index' : sortBy
    const sortOptions = useMemo(
        (): InputSelectOption[] => (hasSkillSearch
            ? [{ label: 'Matching Index', value: 'matching-index' }]
            : [{ label: 'Alphabetical', value: 'alphabetical' }]),
        [hasSkillSearch],
    )

    const filteredResults = useMemo(() => results.filter(talent => {
        if (onlyActive && !talent.isRecentlyActive) {
            return false
        }

        if (onlyOpenToWork && !talent.openToWork) {
            return false
        }

        return true
    }), [onlyActive, onlyOpenToWork, results])

    const displayedResults = useMemo(() => {
        const sorted = [...filteredResults]
        if (activeSort === 'matching-index') {
            sorted.sort((a, b) => b.matchIndex - a.matchIndex)
            return sorted
        }

        sorted.sort((a, b) => String(a.handle || '')
            .localeCompare(String(b.handle || ''), undefined, { sensitivity: 'base' }))
        return sorted
    }, [activeSort, filteredResults])

    const foundMembersCount = totalResults || displayedResults.length
    const displayedResultsWithCountryName = useMemo(
        () => displayedResults.map(talent => {
            const code = String(talent.location || '')
                .trim()
                .toUpperCase()
            const countryName = countryNameByCode.get(code)

            if (!countryName) {
                return talent
            }

            return {
                ...talent,
                location: countryName,
            }
        }),
        [countryNameByCode, displayedResults],
    )
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
    const loadCountryOptions = useCallback(async (query: string): Promise<InputMultiselectOption[]> => {
        const normalizedQuery = query.trim()
            .toLowerCase()
        if (!normalizedQuery) {
            return countryFilterOptions
        }

        return countryFilterOptions.filter(option => String(option.label || '')
            .toLowerCase()
            .includes(normalizedQuery))
    }, [countryFilterOptions])

    const runMemberSearch = useCallback(async (
        skillsToSearch: InputMultiselectOption[],
        overrides?: {
            append?: boolean
            countries?: string[]
            generation?: number
            openToWork?: boolean
            page?: number
            recentlyActive?: boolean
        },
    ): Promise<boolean> => {
        const append = overrides?.append === true
        const countries = (overrides?.countries ?? selectedCountryCodesList)
            .filter(Boolean)
        const generation = overrides?.generation
        const openToWork = overrides?.openToWork ?? onlyOpenToWork
        const page = overrides?.page ?? 1
        const recentlyActive = overrides?.recentlyActive ?? onlyActive
        const payload: MemberSearchPayload = {
            limit: MEMBER_SEARCH_LIMIT,
            page,
            skills: skillsToSearch
                .map(skill => String(skill.value || '')
                    .trim())
                .filter(Boolean)
                .map(skillId => ({
                    id: skillId,
                    wins: 1,
                })),
            skillSearchType: 'OR',
        }

        if (countries.length > 0) {
            payload.countries = countries
        }

        if (openToWork) {
            payload.openToWork = true
        }

        if (recentlyActive) {
            payload.recentlyActive = true
        }

        if (append) {
            setIsLoadingMore(true)
        } else {
            setIsSearchingMembers(true)
        }

        setErrorMessage('')
        try {
            const response = await searchMembers(payload)
            // If generation was provided and has changed, discard stale results
            if (generation !== undefined && searchGenerationRef.current !== generation) {
                return false
            }

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
            return true
        } catch {
            if (!append) {
                setResults([])
                setTotalResults(0)
                setCurrentPage(1)
                setLastSearchedDescription('')
            }

            setErrorMessage('Failed to search matching members. Please try again.')
            return false
        } finally {
            if (append) {
                setIsLoadingMore(false)
            } else {
                setIsSearchingMembers(false)
            }
        }
    }, [onlyActive, onlyOpenToWork, selectedCountryCodesList])

    const clearAllFilters = useCallback((): void => {
        searchGenerationRef.current += 1
        setSelectedCountries([])
        setOnlyOpenToWork(false)
        setOnlyActive(false)
        setSortBy('alphabetical')
        setSelectedSkills([])
        setHasSearched(true)
        setErrorMessage('')
        skipNextAutoSearchRef.current = true
        setLastSearchedDescription('')
        runMemberSearch([], {
            countries: [],
            generation: searchGenerationRef.current,
            openToWork: false,
            page: 1,
            recentlyActive: false,
        })
    }, [runMemberSearch])

    const handleAiSearch = useCallback(async (): Promise<void> => {
        const normalizedDescription = jobDescription.trim()
        if (!normalizedDescription || isExtractingSkills) {
            return
        }

        const generation = searchGenerationRef.current

        setErrorMessage('')
        setIsExtractingSkills(true)

        try {
            const extractedSkillsResult = await extractSkillsFromText(normalizedDescription)
            if (searchGenerationRef.current !== generation) return

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
                skipNextAutoSearchRef.current = true
                return
            }

            setHasSearched(true)
            skipNextAutoSearchRef.current = true
            const searchSucceeded = await runMemberSearch(extractedOptions, { generation, page: 1 })
            if (searchGenerationRef.current !== generation) return

            if (searchSucceeded) {
                setLastSearchedDescription(normalizedDescription)
            }
        } catch {
            skipNextAutoSearchRef.current = true
            if (searchGenerationRef.current !== generation) return
            setErrorMessage('Failed to extract skills. Please try again.')
            setHasSearched(true)
        } finally {
            setIsExtractingSkills(false)

        }
    }, [isExtractingSkills, jobDescription, runMemberSearch])

    useEffect(() => {
        if (!hasSearched || isExtractingSkills) {
            return
        }

        if (skipNextAutoSearchRef.current) {
            skipNextAutoSearchRef.current = false
            return
        }

        runMemberSearch(selectedSkills, { generation: searchGenerationRef.current, page: 1 })
    }, [
        hasSearched,
        isExtractingSkills,
        onlyActive,
        onlyOpenToWork,
        runMemberSearch,
        selectedCountries,
        selectedSkills,
    ])

    const handleLoadMore = useCallback((): void => {
        if (isLoadingMore || isSearchingMembers || !hasMoreResults) {
            return
        }

        runMemberSearch(selectedSkills, {
            append: true,
            page: currentPage + 1,
        })
    }, [currentPage, hasMoreResults, isLoadingMore, isSearchingMembers, runMemberSearch, selectedSkills])
    const isSearchButtonDisabled = useMemo(
        () => isExtractingSkills
        || !jobDescription.trim()
        || jobDescription.trim() === lastSearchedDescription,
        [isExtractingSkills, jobDescription, lastSearchedDescription],
    )
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
                                        searchGenerationRef.current += 1
                                        setJobDescription('')
                                        setErrorMessage('')
                                        setLastSearchedDescription('')
                                    }}
                                >
                                    Clear
                                </Button>
                                <Button
                                    primary
                                    disabled={isSearchButtonDisabled}
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
                                        setHasSearched(value.length > 0)
                                        if (value.length === 0) {
                                            setLastSearchedDescription('')
                                        }
                                    }}
                                />
                            </div>
                            <div className={styles.filterBlock}>
                                <InputMultiselect
                                    label='Country'
                                    name='country'
                                    options={countryFilterOptions}
                                    onFetchOptions={loadCountryOptions}
                                    value={selectedCountries}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        const value = (event.target.value || []) as InputMultiselectOption[]
                                        setSelectedCountries(value)
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
                                            + 'or engagement in the past 3 months.'
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
                                {!isSearchingMembers && (
                                    <div className={styles.resultsTop}>
                                        <p className={styles.foundText}>
                                            We have found&nbsp;
                                            <span className={styles.foundTextCount}>
                                                {`${foundMembersCount} members`}
                                            </span>
                                            &nbsp;that match your search.
                                        </p>
                                        <div className={styles.sortControl}>
                                            <span className={styles.sortLabel}>Sort by</span>
                                            <InputSelect
                                                classNameWrapper={styles.matchingIndexSelect}
                                                name='sortBy'
                                                options={sortOptions}
                                                value={activeSort}
                                                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                                    const nextSort = event.target.value || 'alphabetical'
                                                    setSortBy(
                                                        nextSort as TalentSearchSortOption,
                                                    )
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                                {isSearchingMembers && (
                                    <div className={styles.emptyState}>
                                        <h4>Searching talent...</h4>
                                    </div>
                                )}
                                {!isSearchingMembers && displayedResults.length === 0 && (
                                    <div className={styles.emptyState}>
                                        <h4>No matching talent found</h4>
                                        <p>Try changing filters or using a different job description.</p>
                                    </div>
                                )}
                                {!isSearchingMembers && displayedResults.length > 0 && (
                                    <>
                                        <div className={styles.cardsGrid}>
                                            {displayedResultsWithCountryName.map(talent => (
                                                <TalentResultCard
                                                    key={talent.id}
                                                    talent={talent}
                                                    showSkillMatch={hasSkillSearch}
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
