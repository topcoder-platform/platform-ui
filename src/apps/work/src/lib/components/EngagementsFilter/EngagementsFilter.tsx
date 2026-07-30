import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import Select, { SingleValue } from 'react-select'

import {
    Button,
    IconOutline,
    InputMultiselect,
    InputMultiselectOption,
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

function getStatusOptions(): InputMultiselectOption[] {
    return ENGAGEMENT_STATUSES.map(status => ({
        label: status,
        value: status,
    }))
}

/**
 * Resolves the selected status options for the engagement status filter.
 *
 * The ticket default treats an empty filter value as all engagement statuses
 * selected, so clearing the multiselect returns the control to the default
 * unfiltered state.
 *
 * @param statusOptions available engagement status select options.
 * @param selectedStatuses selected status labels stored in the page filters.
 * @returns selected status options, or every status option for the default state.
 */
function getSelectedStatusOptions(
    statusOptions: InputMultiselectOption[],
    selectedStatuses?: string[],
): InputMultiselectOption[] {
    if (!selectedStatuses?.length) {
        return statusOptions
    }

    const selectedStatusValues = new Set(selectedStatuses)

    return statusOptions.filter(option => selectedStatusValues.has(option.value))
}

/**
 * Normalizes multiselect status values for the applied filter payload.
 *
 * @param selectedStatuses selected status labels from the draft control.
 * @param statusOptionCount total number of available status options.
 * @returns undefined when every status (or none) is selected; otherwise the list.
 */
function normalizeStatusFilter(
    selectedStatuses: string[],
    statusOptionCount: number,
): string[] | undefined {
    if (selectedStatuses.length === 0 || selectedStatuses.length === statusOptionCount) {
        return undefined
    }

    return selectedStatuses
}

/**
 * Compares two optional status filter arrays for equality.
 *
 * @param left first status filter value.
 * @param right second status filter value.
 * @returns true when both values represent the same applied status filter.
 */
function areStatusFiltersEqual(
    left?: string[],
    right?: string[],
): boolean {
    const leftValues = left || []
    const rightValues = right || []

    if (leftValues.length !== rightValues.length) {
        return false
    }

    const rightValuesSet = new Set(rightValues)

    return leftValues.every(value => rightValuesSet.has(value))
}

export const EngagementsFilter: FC<EngagementsFilterProps> = (props: EngagementsFilterProps) => {
    const filters = props.filters
    const showProjectNameFilter = !!props.showProjectNameFilter
    const onFiltersChange = props.onFiltersChange

    const [titleInput, setTitleInput] = useState<string>(filters.title || '')
    const [projectNameInput, setProjectNameInput] = useState<string>(filters.projectName || '')
    const [draftStatus, setDraftStatus] = useState<string[] | undefined>(filters.status)
    const [draftVisibility, setDraftVisibility] = useState<'private' | 'public' | undefined>(
        filters.visibility,
    )
    const isFirstRender = useRef<boolean>(true)

    useEffect(() => {
        setTitleInput(filters.title || '')
    }, [filters.title])

    useEffect(() => {
        setProjectNameInput(filters.projectName || '')
    }, [filters.projectName])

    useEffect(() => {
        setDraftStatus(filters.status)
    }, [filters.status])

    useEffect(() => {
        setDraftVisibility(filters.visibility)
    }, [filters.visibility])

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

    const statusOptions = useMemo<InputMultiselectOption[]>(() => getStatusOptions(), [])

    const selectedStatus = useMemo<InputMultiselectOption[]>(
        () => getSelectedStatusOptions(statusOptions, draftStatus),
        [draftStatus, statusOptions],
    )

    const selectedVisibility = useMemo(
        () => VISIBILITY_OPTIONS.find(option => option.value === (draftVisibility || 'all')),
        [draftVisibility],
    )

    const hasPendingSelectFilters = !areStatusFiltersEqual(draftStatus, filters.status)
        || draftVisibility !== filters.visibility

    const fetchStatusOptions = useCallback(async (query: string): Promise<InputMultiselectOption[]> => {
        if (!query) {
            return statusOptions
        }

        const normalizedQuery = query.toLowerCase()

        return statusOptions.filter(option => {
            const normalizedLabel = option.label?.toString()
                .toLowerCase()

            return normalizedLabel?.includes(normalizedQuery)
        })
    }, [statusOptions])

    function handleSearchChange(event: ChangeEvent<HTMLInputElement>): void {
        setTitleInput(event.target.value)
    }

    function handleProjectSearchChange(event: ChangeEvent<HTMLInputElement>): void {
        setProjectNameInput(event.target.value)
    }

    function handleStatusChange(event: ChangeEvent<HTMLInputElement>): void {
        const options = (event.target.value || []) as unknown as InputMultiselectOption[]
        const selectedStatuses = options.map(option => option.value)
            .filter(Boolean)

        setDraftStatus(normalizeStatusFilter(selectedStatuses, statusOptions.length))
    }

    function handleVisibilityChange(nextOption: SingleValue<SelectOption>): void {
        setDraftVisibility(nextOption?.value === 'all'
            ? undefined
            : nextOption?.value as 'private' | 'public')
    }

    function handleApplyFilters(): void {
        const normalizedTitle = titleInput.trim() || undefined
        const normalizedProjectName = projectNameInput.trim() || undefined

        onFiltersChange({
            ...filters,
            projectName: showProjectNameFilter
                ? normalizedProjectName
                : undefined,
            status: draftStatus,
            title: normalizedTitle,
            visibility: draftVisibility,
        })
    }

    return (
        <div
            className={`${styles.container}${showProjectNameFilter ? ` ${styles.withProjectFilter}` : ''}`}
        >
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
                <label htmlFor='work-engagements-status'>Status</label>
                <InputMultiselect
                    className={styles.statusMultiselect}
                    label='Engagement Status'
                    name='work-engagements-status'
                    openMenuOnClick
                    options={statusOptions}
                    onFetchOptions={fetchStatusOptions}
                    onChange={handleStatusChange}
                    placeholder='Select statuses'
                    value={selectedStatus}
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

            <div className={styles.actions}>
                <Button
                    disabled={!hasPendingSelectFilters}
                    label='Apply Filters'
                    onClick={handleApplyFilters}
                    primary
                    size='lg'
                />
            </div>
        </div>
    )
}

export default EngagementsFilter
