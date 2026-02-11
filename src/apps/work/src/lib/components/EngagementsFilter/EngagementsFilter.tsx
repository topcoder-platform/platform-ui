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
    Button,
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
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    status?: string
    title?: string
}

interface EngagementsFilterProps {
    filters: EngagementsListFilters
    onFiltersChange: (nextFilters: EngagementsListFilters) => void
}

const SORT_BY_OPTIONS: SelectOption[] = [
    {
        label: 'Anticipated Start',
        value: 'anticipatedStart',
    },
    {
        label: 'Created Date',
        value: 'createdAt',
    },
]

const SORT_ORDER_OPTIONS: SelectOption[] = [
    {
        label: 'Ascending',
        value: 'asc',
    },
    {
        label: 'Descending',
        value: 'desc',
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
    const onFiltersChange = props.onFiltersChange

    const [titleInput, setTitleInput] = useState<string>(filters.title || '')
    const isFirstRender = useRef<boolean>(true)

    useEffect(() => {
        setTitleInput(filters.title || '')
    }, [filters.title])

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return undefined
        }

        const timeout = window.setTimeout(() => {
            if ((filters.title || '') !== titleInput) {
                onFiltersChange({
                    ...filters,
                    title: titleInput.trim() || undefined,
                })
            }
        }, 350)

        return () => {
            window.clearTimeout(timeout)
        }
    }, [filters, onFiltersChange, titleInput])

    const statusOptions = useMemo<SelectOption[]>(() => getStatusOptions(), [])

    const selectedStatus = useMemo(
        () => statusOptions.find(option => option.value === (filters.status || 'all')),
        [filters.status, statusOptions],
    )

    const selectedSortBy = useMemo(
        () => SORT_BY_OPTIONS.find(option => option.value === (filters.sortBy || 'anticipatedStart')),
        [filters.sortBy],
    )

    const selectedSortOrder = useMemo(
        () => SORT_ORDER_OPTIONS.find(option => option.value === (filters.sortOrder || 'asc')),
        [filters.sortOrder],
    )

    function handleSearchChange(event: ChangeEvent<HTMLInputElement>): void {
        setTitleInput(event.target.value)
    }

    function handleStatusChange(nextOption: SingleValue<SelectOption>): void {
        onFiltersChange({
            ...filters,
            status: nextOption?.value === 'all'
                ? undefined
                : nextOption?.value,
        })
    }

    function handleSortByChange(nextOption: SingleValue<SelectOption>): void {
        onFiltersChange({
            ...filters,
            sortBy: nextOption?.value || 'anticipatedStart',
        })
    }

    function handleSortOrderChange(nextOption: SingleValue<SelectOption>): void {
        onFiltersChange({
            ...filters,
            sortOrder: (nextOption?.value || 'asc') as 'asc' | 'desc',
        })
    }

    function handleReset(): void {
        setTitleInput('')
        onFiltersChange({
            sortBy: 'anticipatedStart',
            sortOrder: 'asc',
            status: undefined,
            title: undefined,
        })
    }

    return (
        <div className={styles.container}>
            <div className={styles.filterField}>
                <label htmlFor='work-engagements-search'>Search</label>
                <div className={styles.searchInputWrap}>
                    <IconOutline.SearchIcon className={styles.searchIcon} />
                    <input
                        id='work-engagements-search'
                        aria-label='Search engagements by title'
                        className={styles.searchInput}
                        onChange={handleSearchChange}
                        placeholder='Search by title'
                        type='text'
                        value={titleInput}
                    />
                </div>
            </div>

            <div className={styles.filterField}>
                <label htmlFor='work-engagements-status'>Status</label>
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
                <label htmlFor='work-engagements-sort-by'>Sort by</label>
                <Select
                    inputId='work-engagements-sort-by'
                    className='react-select-container'
                    classNamePrefix='select'
                    options={SORT_BY_OPTIONS}
                    value={selectedSortBy}
                    onChange={handleSortByChange}
                    isClearable={false}
                />
            </div>

            <div className={styles.filterField}>
                <label htmlFor='work-engagements-sort-order'>Sort order</label>
                <Select
                    inputId='work-engagements-sort-order'
                    className='react-select-container'
                    classNamePrefix='select'
                    options={SORT_ORDER_OPTIONS}
                    value={selectedSortOrder}
                    onChange={handleSortOrderChange}
                    isClearable={false}
                />
            </div>

            <div className={styles.actions}>
                <Button
                    label='Reset'
                    onClick={handleReset}
                    secondary
                    size='md'
                />
            </div>
        </div>
    )
}

export default EngagementsFilter
