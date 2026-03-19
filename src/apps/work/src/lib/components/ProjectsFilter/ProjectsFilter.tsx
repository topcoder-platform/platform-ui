import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import AsyncSelect from 'react-select/async'
import Select, { SingleValue } from 'react-select'
import classNames from 'classnames'

import {
    Button,
    IconOutline,
    InputCheckbox,
} from '~/libs/ui'

import { PROJECT_STATUSES } from '../../constants'
import {
    AUTOCOMPLETE_DEBOUNCE_TIME_MS,
    AUTOCOMPLETE_MIN_LENGTH,
} from '../../constants/challenge-editor.constants'
import {
    Project,
    ProjectFilters,
} from '../../models'
import {
    BillingAccount,
    fetchBillingAccountById,
    searchBillingAccounts,
} from '../../services'

import styles from './ProjectsFilter.module.scss'

interface ProjectsFilterProps {
    filters: ProjectFilters
    onFiltersChange: (newFilters: ProjectFilters) => void
    isManager: boolean
    projects: Project[]
}

interface SelectOption {
    label: string
    value: string
}

function normalizeBillingAccountId(value: number | string | undefined): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

function toBillingAccountOption(billingAccount: BillingAccount): SelectOption {
    return {
        label: `${billingAccount.name} / ${billingAccount.id}`,
        value: String(billingAccount.id),
    }
}

function createFallbackBillingAccountOption(
    billingAccountId: string,
): SelectOption {
    return {
        label: `Unknown / ${billingAccountId}`,
        value: billingAccountId,
    }
}

function mergeOptions(
    currentOptions: SelectOption[],
    incomingOptions: SelectOption[],
): SelectOption[] {
    const optionMap = new Map<string, SelectOption>()

    currentOptions.forEach(option => {
        optionMap.set(option.value, option)
    })

    incomingOptions.forEach(option => {
        optionMap.set(option.value, option)
    })

    return Array.from(optionMap.values())
}

function createDebouncedLoader(
    loader: (value: string) => Promise<SelectOption[]>,
): (value: string) => Promise<SelectOption[]> {
    let timeoutId: number | undefined

    return (value: string): Promise<SelectOption[]> => new Promise(resolve => {
        if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId)
        }

        timeoutId = window.setTimeout(async () => {
            resolve(await loader(value))
        }, AUTOCOMPLETE_DEBOUNCE_TIME_MS)
    })
}

export const ProjectsFilter: FC<ProjectsFilterProps> = (props: ProjectsFilterProps) => {
    const filters: ProjectFilters = props.filters
    const isManager: boolean = props.isManager
    const onFiltersChange: (newFilters: ProjectFilters) => void = props.onFiltersChange
    const projects: Project[] = props.projects

    const [keywordInput, setKeywordInput] = useState<string>(filters.keyword || '')
    const [billingAccountOptionCache, setBillingAccountOptionCache] = useState<SelectOption[]>([])
    const [billingAccountSearchError, setBillingAccountSearchError] = useState<string | undefined>(
        undefined,
    )
    const isFirstDebouncedRender = useRef<boolean>(true)

    useEffect(() => {
        setKeywordInput(filters.keyword || '')
    }, [filters.keyword])

    useEffect(() => {
        let timeout: number | undefined

        if (isFirstDebouncedRender.current) {
            isFirstDebouncedRender.current = false
        } else {
            timeout = window.setTimeout(() => {
                if ((filters.keyword || '') !== keywordInput) {
                    onFiltersChange({
                        ...filters,
                        keyword: keywordInput || undefined,
                    })
                }
            }, 350)
        }

        return () => {
            if (timeout) {
                window.clearTimeout(timeout)
            }
        }
    }, [filters, keywordInput, onFiltersChange])

    const statusOptions = useMemo<SelectOption[]>(
        () => [
            {
                label: 'All statuses',
                value: '',
            },
            ...PROJECT_STATUSES,
        ],
        [],
    )

    const selectedStatusValue = Array.isArray(filters.status)
        ? (filters.status[0] || '')
        : (filters.status || '')
    const selectedBillingAccountId = filters.billingAccountId || ''

    const projectBillingAccountOptions = useMemo<SelectOption[]>(
        () => {
            const billingAccountOptionMap = new Map<string, SelectOption>()

            projects.forEach(project => {
                const billingAccountId = normalizeBillingAccountId(project.billingAccountId)
                const billingAccountName = (project.billingAccountName || '').trim()

                if (!billingAccountId || !billingAccountName) {
                    return
                }

                billingAccountOptionMap.set(
                    billingAccountId,
                    {
                        label: `${billingAccountName} / ${billingAccountId}`,
                        value: billingAccountId,
                    },
                )
            })

            return Array.from(billingAccountOptionMap.values())
        },
        [projects],
    )

    useEffect(() => {
        if (!projectBillingAccountOptions.length) {
            return
        }

        setBillingAccountOptionCache(previousOptions => mergeOptions(
            previousOptions,
            projectBillingAccountOptions,
        ))
    }, [projectBillingAccountOptions])

    const hasSelectedBillingAccountOption = useMemo(
        () => !!selectedBillingAccountId
            && billingAccountOptionCache.some(option => option.value === selectedBillingAccountId),
        [billingAccountOptionCache, selectedBillingAccountId],
    )

    useEffect(() => {
        if (!selectedBillingAccountId || hasSelectedBillingAccountOption) {
            return undefined
        }

        let isMounted = true

        fetchBillingAccountById(selectedBillingAccountId)
            .then(billingAccount => {
                if (!isMounted) {
                    return
                }

                setBillingAccountOptionCache(previousOptions => mergeOptions(previousOptions, [
                    toBillingAccountOption(billingAccount),
                ]))
            })
            .catch(() => {
                if (!isMounted) {
                    return
                }

                setBillingAccountOptionCache(previousOptions => mergeOptions(previousOptions, [
                    createFallbackBillingAccountOption(selectedBillingAccountId),
                ]))
            })

        return () => {
            isMounted = false
        }
    }, [hasSelectedBillingAccountOption, selectedBillingAccountId])

    const loadBillingAccountOptions = useCallback(
        async (inputValue: string): Promise<SelectOption[]> => {
            const normalizedInputValue = inputValue.trim()

            setBillingAccountSearchError(undefined)

            if (normalizedInputValue.length < AUTOCOMPLETE_MIN_LENGTH) {
                return []
            }

            try {
                const billingAccounts = await searchBillingAccounts({
                    name: normalizedInputValue,
                    page: 1,
                    perPage: 20,
                })
                const options = billingAccounts.map(account => toBillingAccountOption(account))

                setBillingAccountOptionCache(previousOptions => mergeOptions(previousOptions, options))

                return options
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : 'Failed to search billing accounts.'

                setBillingAccountSearchError(errorMessage)

                return []
            }
        },
        [],
    )

    const debouncedLoadBillingAccountOptions = useMemo(
        () => createDebouncedLoader(loadBillingAccountOptions),
        [loadBillingAccountOptions],
    )

    const selectedStatus = useMemo<SelectOption | undefined>(
        () => statusOptions.find(option => option.value === selectedStatusValue),
        [selectedStatusValue, statusOptions],
    )

    const selectedBillingAccount = useMemo<SelectOption | undefined>(
        () => {
            if (!selectedBillingAccountId) {
                return undefined
            }

            return billingAccountOptionCache.find(option => option.value === selectedBillingAccountId)
                || createFallbackBillingAccountOption(selectedBillingAccountId)
        },
        [billingAccountOptionCache, selectedBillingAccountId],
    )

    const billingAccountNoOptionsMessage = useCallback(
        ({
            inputValue,
        }: {
            inputValue: string
        }): string => {
            if (billingAccountSearchError) {
                return billingAccountSearchError
            }

            if (inputValue.trim().length < AUTOCOMPLETE_MIN_LENGTH) {
                return `Type at least ${AUTOCOMPLETE_MIN_LENGTH} characters to search`
            }

            return 'No billing accounts found'
        },
        [billingAccountSearchError],
    )

    function updateFilters(partial: Partial<ProjectFilters>): void {
        onFiltersChange({
            ...filters,
            ...partial,
        })
    }

    function handleKeywordInputChange(event: ChangeEvent<HTMLInputElement>): void {
        setKeywordInput(event.target.value)
    }

    function handleStatusChange(option: SingleValue<SelectOption>): void {
        const nextStatus = option?.value || ''
        const normalizedStatus = PROJECT_STATUSES.some(item => item.value === nextStatus)
            ? nextStatus as ProjectFilters['status']
            : undefined

        updateFilters({
            status: normalizedStatus,
        })
    }

    function handleBillingAccountChange(option: SingleValue<SelectOption>): void {
        updateFilters({
            billingAccountId: option?.value || undefined,
        })
    }

    const noopCheckboxChange = (() => undefined) as (event: Event) => void

    function handleOnlyMyProjectsToggle(): void {
        updateFilters({
            memberOnly: !filters.memberOnly,
        })
    }

    function handleClearFilters(): void {
        setKeywordInput('')
        onFiltersChange({
            billingAccountId: undefined,
            keyword: undefined,
            memberOnly: undefined,
            status: undefined,
        })
    }

    return (
        <div className={classNames(styles.container, {
            [styles.managerContainer]: isManager,
        })}
        >
            <div className={styles.filterField}>
                <label htmlFor='work-projects-search'>Search</label>
                <div className={styles.searchInputWrap}>
                    <IconOutline.SearchIcon className={styles.searchIcon} />
                    <input
                        id='work-projects-search'
                        aria-label='Search projects'
                        className={styles.searchInput}
                        onChange={handleKeywordInputChange}
                        placeholder='Search project name'
                        type='text'
                        value={keywordInput}
                    />
                </div>
            </div>

            <div className={styles.filterField}>
                <label htmlFor='work-projects-status'>Status</label>
                <Select
                    inputId='work-projects-status'
                    className='react-select-container'
                    classNamePrefix='select'
                    options={statusOptions}
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    isClearable
                />
            </div>

            <div className={styles.filterField}>
                <label htmlFor='work-projects-billing-account'>Billing account</label>
                <AsyncSelect
                    inputId='work-projects-billing-account'
                    cacheOptions
                    className='react-select-container'
                    classNamePrefix='select'
                    defaultOptions={false}
                    isClearable
                    loadOptions={debouncedLoadBillingAccountOptions}
                    noOptionsMessage={billingAccountNoOptionsMessage}
                    onChange={handleBillingAccountChange}
                    placeholder='All billing accounts'
                    value={selectedBillingAccount}
                />
            </div>

            <div className={styles.actions}>
                <Button
                    secondary
                    size='lg'
                    label='Clear Filters'
                    onClick={handleClearFilters}
                />
            </div>

            {isManager ? (
                <div className={classNames(styles.filterField, styles.bottomAlignedField)}>
                    <div className={styles.checkboxWrap}>
                        <InputCheckbox
                            checked={!!filters.memberOnly}
                            name='project-member-only'
                            label='Only My Projects'
                            onChange={noopCheckboxChange}
                            onClick={handleOnlyMyProjectsToggle}
                        />
                    </div>
                </div>
            ) : undefined}
        </div>
    )
}

export default ProjectsFilter
