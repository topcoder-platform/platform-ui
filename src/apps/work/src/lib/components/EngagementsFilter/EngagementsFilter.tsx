import {
    ChangeEvent,
    FC,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import Select, { MultiValue, SingleValue } from 'react-select'

import {
    IconOutline,
} from '~/libs/ui'

import {
    ENGAGEMENT_STATUSES,
} from '../../constants'

import styles from './EngagementsFilter.module.scss'

interface SelectOption {
    label: string
    value: string
}

export interface EngagementsListFilters {
    projectName?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    status?: string[]
    title?: string
    visibility?: 'private' | 'public'
}

interface EngagementsFilterProps {
    filters: EngagementsListFilters
    showProjectNameFilter?: boolean
    onFiltersChange: (nextFilters: EngagementsListFilters) => void
}

const VISIBILITY_OPTIONS: SelectOption[] = [
    {
        label: 'All',
        value: 'all',
    },
    {
        label: 'Public',
        value: 'public',
    },
    {
        label: 'Private',
        value: 'private',
    },
]

function getStatusOptions(): SelectOption[] {
    return ENGAGEMENT_STATUSES.map(status => ({
        label: status,
        value: status,
    }))
}

/**
 * Resolves the selected status options for the engagement status filter.
 *
 * The ticket default treats an empty filter value as all engagement statuses
 * selected, so clearing the multi-select returns the control to the default
 * unfiltered state.
 *
 * @param statusOptions available engagement status select options.
 * @param selectedStatuses selected status labels stored in the page filters.
 * @returns selected status options, or every status option for the default state.
 */
function getSelectedStatusOptions(
    statusOptions: SelectOption[],
    selectedStatuses?: string[],
): SelectOption[] {
    if (!selectedStatuses?.length) {
        return statusOptions
    }

    const selectedStatusValues = new Set(selectedStatuses)

    return statusOptions.filter(option => selectedStatusValues.has(option.value))
}

export const EngagementsFilter: FC<EngagementsFilterProps> = (props: EngagementsFilterProps) => {
    const filters = props.filters
    const showProjectNameFilter = !!props.showProjectNameFilter
    const onFiltersChange = props.onFiltersChange

    const [titleInput, setTitleInput] = useState<string>(filters.title || '')
    const [projectNameInput, setProjectNameInput] = useState<string>(filters.projectName || '')
    const isFirstRender = useRef<boolean>(true)

    useEffect(() => {
        setTitleInput(filters.title || '')
    }, [filters.title])

    useEffect(() => {
        setProjectNameInput(filters.projectName || '')
    }, [filters.projectName])

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return undefined
        }

        const timeout = window.setTimeout(() => {
            const normalizedTitle = titleInput.trim() || undefined
            const normalizedProjectName = projectNameInput.trim() || undefined

            if (
                (filters.title || '') !== titleInput
                || (filters.projectName || '') !== projectNameInput
            ) {
                onFiltersChange({
                    ...filters,
                    projectName: showProjectNameFilter
                        ? normalizedProjectName
                        : undefined,
                    title: normalizedTitle,
                })
            }
        }, 350)

        return () => {
            window.clearTimeout(timeout)
        }
    }, [filters, onFiltersChange, projectNameInput, showProjectNameFilter, titleInput])

    const statusOptions = useMemo<SelectOption[]>(() => getStatusOptions(), [])

    const selectedStatus = useMemo<SelectOption[]>(
        () => getSelectedStatusOptions(statusOptions, filters.status),
        [filters.status, statusOptions],
    )

    const selectedVisibility = useMemo(
        () => VISIBILITY_OPTIONS.find(option => option.value === (filters.visibility || 'all')),
        [filters.visibility],
    )

    function handleSearchChange(event: ChangeEvent<HTMLInputElement>): void {
        setTitleInput(event.target.value)
    }

    function handleProjectSearchChange(event: ChangeEvent<HTMLInputElement>): void {
        setProjectNameInput(event.target.value)
    }

    function handleStatusChange(nextOptions: MultiValue<SelectOption>): void {
        const selectedStatuses = Array.from(nextOptions || [])
            .map(option => option.value)
            .filter(Boolean)

        onFiltersChange({
            ...filters,
            status: selectedStatuses.length === 0 || selectedStatuses.length === statusOptions.length
                ? undefined
                : selectedStatuses,
        })
    }

    function handleVisibilityChange(nextOption: SingleValue<SelectOption>): void {
        onFiltersChange({
            ...filters,
            visibility: nextOption?.value === 'all'
                ? undefined
                : nextOption?.value as 'private' | 'public',
        })
    }

    return (
        <div className={styles.container}>
            <div className={styles.filterField}>
                <label htmlFor='work-engagements-search'>Search by name</label>
                <div className={styles.searchInputWrap}>
                    <IconOutline.SearchIcon className={styles.searchIcon} />
                    <input
                        id='work-engagements-search'
                        aria-label='Search engagements by name'
                        className={styles.searchInput}
                        onChange={handleSearchChange}
                        placeholder='Search by name'
                        type='text'
                        value={titleInput}
                    />
                </div>
            </div>

            {showProjectNameFilter && (
                <div className={styles.filterField}>
                    <label htmlFor='work-engagements-project-search'>Search by project name</label>
                    <div className={styles.searchInputWrap}>
                        <IconOutline.SearchIcon className={styles.searchIcon} />
                        <input
                            id='work-engagements-project-search'
                            aria-label='Search engagements by project name'
                            className={styles.searchInput}
                            onChange={handleProjectSearchChange}
                            placeholder='Search by project name'
                            type='text'
                            value={projectNameInput}
                        />
                    </div>
                </div>
            )}

            <div className={styles.filterField}>
                <label htmlFor='work-engagements-status'>Engagement Status</label>
                <Select<SelectOption, true>
                    inputId='work-engagements-status'
                    className='react-select-container'
                    classNamePrefix='select'
                    options={statusOptions}
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    closeMenuOnSelect={false}
                    isClearable
                    isMulti
                />
            </div>

            <div className={styles.filterField}>
                <label htmlFor='work-engagements-visibility'>Visibility</label>
                <Select<SelectOption, false>
                    inputId='work-engagements-visibility'
                    className='react-select-container'
                    classNamePrefix='select'
                    options={VISIBILITY_OPTIONS}
                    value={selectedVisibility}
                    onChange={handleVisibilityChange}
                    isClearable={false}
                />
            </div>
        </div>
    )
}

export default EngagementsFilter
