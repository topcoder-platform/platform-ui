import {
    ChangeEvent,
    FC,
    FocusEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import {
    Button,
    InputCheckbox,
    InputSelectOption,
    InputSelectReact,
    InputText,
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

    const statusOptions = useMemo<InputSelectOption[]>(
        () => [
            {
                label: 'All statuses',
                value: '',
            },
            ...PROJECT_STATUSES,
        ],
        [],
    )

    const selectedStatus = Array.isArray(filters.status)
        ? (filters.status[0] || '')
        : (filters.status || '')

    function updateFilters(partial: Partial<ProjectFilters>): void {
        onFiltersChange({
            ...filters,
            ...partial,
        })
    }

    function handleKeywordInputChange(event: FocusEvent<HTMLInputElement>): void {
        setKeywordInput(event.target.value)
    }

    function handleStatusChange(event: ChangeEvent<HTMLInputElement>): void {
        const selectedStatusValue = event.target.value
        const normalizedStatus = PROJECT_STATUSES.some(item => item.value === selectedStatusValue)
            ? selectedStatusValue as ProjectFilters['status']
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
                <InputText
                    classNameWrapper={styles.inputWrapper}
                    forceUpdateValue
                    label='Search'
                    name='taas-project-keyword'
                    onChange={handleKeywordInputChange}
                    placeholder='Keyword'
                    type='text'
                    value={keywordInput}
                />
            </div>

            <div className={styles.filterField}>
                <InputSelectReact
                    isClearable
                    label='Project status'
                    name='taas-project-status'
                    onChange={handleStatusChange}
                    options={statusOptions}
                    placeholder='All statuses'
                    value={selectedStatus}
                />
            </div>

            <div className={styles.filterField}>
                {isManager
                    ? (
                        <div className={styles.checkboxWrap}>
                            <InputCheckbox
                                checked={!!filters.memberOnly}
                                label='Only My Projects'
                                name='taas-project-member-only'
                                onChange={noopCheckboxChange}
                                onClick={handleOnlyMyProjectsToggle}
                            />
                        </div>
                    )
                    : undefined}
            </div>

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
