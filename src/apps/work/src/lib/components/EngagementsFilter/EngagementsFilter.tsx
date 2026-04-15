import {
    ChangeEvent,
    FC,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import Select, { SingleValue } from 'react-select'

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
    status?: string
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
    return [
        {
            label: 'All',
            value: 'all',
        },
        ...ENGAGEMENT_STATUSES.map(status => ({
            label: status,
            value: status,
        })),
    ]
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

    const selectedStatus = useMemo(
        () => statusOptions.find(option => option.value === (filters.status || 'all')),
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

    function handleStatusChange(nextOption: SingleValue<SelectOption>): void {
        onFiltersChange({
            ...filters,
            status: nextOption?.value === 'all'
                ? undefined
                : nextOption?.value,
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
                <Select
                    inputId='work-engagements-status'
                    className='react-select-container'
                    classNamePrefix='select'
                    options={statusOptions}
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    isClearable={false}
                />
            </div>

            <div className={styles.filterField}>
                <label htmlFor='work-engagements-visibility'>Visibility</label>
                <Select
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
