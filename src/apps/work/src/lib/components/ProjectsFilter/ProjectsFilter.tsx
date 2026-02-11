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

import { PROJECT_STATUSES } from '../../constants'
import { ProjectFilters } from '../../models'

import styles from './ProjectsFilter.module.scss'

interface ProjectsFilterProps {
    filters: ProjectFilters
    onFiltersChange: (newFilters: ProjectFilters) => void
    isManager: boolean
}

export const ProjectsFilter: FC<ProjectsFilterProps> = (props: ProjectsFilterProps) => {
    const filters: ProjectFilters = props.filters
    const isManager: boolean = props.isManager
    const onFiltersChange: (newFilters: ProjectFilters) => void = props.onFiltersChange

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
                    name='project-keyword'
                    type='text'
                    label='Search'
                    placeholder='Keyword'
                    value={keywordInput}
                    forceUpdateValue
                    onChange={handleKeywordInputChange}
                    classNameWrapper={styles.inputWrapper}
                />
            </div>

            <div className={styles.filterField}>
                <InputSelectReact
                    name='project-status'
                    label='Project status'
                    value={selectedStatus}
                    options={statusOptions}
                    placeholder='All statuses'
                    onChange={handleStatusChange}
                    isClearable
                />
            </div>

            <div className={styles.filterField}>
                {isManager ? (
                    <div className={styles.checkboxWrap}>
                        <InputCheckbox
                            checked={!!filters.memberOnly}
                            name='project-member-only'
                            label='Only My Projects'
                            onChange={noopCheckboxChange}
                            onClick={handleOnlyMyProjectsToggle}
                        />
                    </div>
                ) : undefined}
            </div>

            <div className={styles.actions}>
                <Button
                    secondary
                    size='lg'
                    label='Clear Filters'
                    onClick={handleClearFilters}
                />
            </div>
        </div>
    )
}

export default ProjectsFilter
