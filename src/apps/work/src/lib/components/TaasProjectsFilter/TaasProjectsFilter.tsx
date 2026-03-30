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
    InputCheckbox,
} from '~/libs/ui'

import {
    PROJECT_STATUSES,
} from '../../constants'
import {
    ProjectFilters,
} from '../../models'

import styles from './TaasProjectsFilter.module.scss'

interface TaasProjectsFilterProps {
    filters: ProjectFilters
    isManager: boolean
    onFiltersChange: (newFilters: ProjectFilters) => void
}

interface SelectOption {
    label: string
    value: string
}

export const TaasProjectsFilter: FC<TaasProjectsFilterProps> = (props: TaasProjectsFilterProps) => {
    const filters = props.filters
    const isManager = props.isManager
    const onFiltersChange = props.onFiltersChange

    const [keywordInput, setKeywordInput] = useState<string>(filters.keyword || '')
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

    const selectedStatus = useMemo<SelectOption | undefined>(
        () => statusOptions.find(option => option.value === selectedStatusValue),
        [selectedStatusValue, statusOptions],
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

    const noopCheckboxChange = (() => undefined) as (event: Event) => void

    function handleOnlyMyProjectsToggle(): void {
        updateFilters({
            memberOnly: !filters.memberOnly,
        })
    }

    function handleClearFilters(): void {
        setKeywordInput('')
        onFiltersChange({
            keyword: undefined,
            memberOnly: undefined,
            status: undefined,
        })
    }

    return (
        <div className={styles.container}>
            <div className={styles.filterField}>
                <label htmlFor='work-taas-projects-search'>Search</label>
                <div className={styles.searchInputWrap}>
                    <IconOutline.SearchIcon className={styles.searchIcon} />
                    <input
                        id='work-taas-projects-search'
                        aria-label='Search TaaS projects'
                        className={styles.searchInput}
                        onChange={handleKeywordInputChange}
                        placeholder='Search project name'
                        type='text'
                        value={keywordInput}
                    />
                </div>
            </div>

            <div className={styles.filterField}>
                <label htmlFor='work-taas-projects-status'>Status</label>
                <Select
                    inputId='work-taas-projects-status'
                    className='react-select-container'
                    classNamePrefix='select'
                    options={statusOptions}
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    isClearable
                />
            </div>

            {isManager
                ? (
                    <div className={`${styles.filterField} ${styles.bottomAlignedField}`}>
                        <div className={styles.checkboxWrap}>
                            <InputCheckbox
                                checked={!!filters.memberOnly}
                                label='Only My Projects'
                                name='taas-project-member-only'
                                onChange={noopCheckboxChange}
                                onClick={handleOnlyMyProjectsToggle}
                            />
                        </div>
                    </div>
                )
                : undefined}

            <div className={styles.actions}>
                <Button
                    label='Clear Filters'
                    onClick={handleClearFilters}
                    secondary
                    size='lg'
                />
            </div>
        </div>
    )
}

export default TaasProjectsFilter
