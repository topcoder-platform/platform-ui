import {
    ChangeEvent,
    FC,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { startCase, toLower } from 'lodash'
import Select, { SingleValue } from 'react-select'

import {
    Button,
    IconOutline,
    InputDatePicker,
} from '~/libs/ui'

import {
    CHALLENGE_STATUS,
} from '../../constants'
import {
    ChallengeFilters,
    ChallengeType,
} from '../../models'

import styles from './ChallengesFilter.module.scss'

interface SelectOption {
    label: string
    value: string
}

interface ChallengesFilterProps {
    filters: ChallengeFilters
    challengeTypes: ChallengeType[]
    onFiltersChange: (newFilters: ChallengeFilters) => void
    dashboardMode?: boolean
    projectOptions?: SelectOption[]
    isLoadingChallengeTypes?: boolean
}

function toDate(value?: string): Date | undefined {
    if (!value) {
        return undefined
    }

    const parsed = new Date(value)

    return Number.isNaN(parsed.getTime())
        ? undefined
        : parsed
}

function toIsoDateString(date?: Date): string | undefined {
    if (!date) {
        return undefined
    }

    return date.toISOString()
}

function getStatusLabel(status: string): string {
    if (status === CHALLENGE_STATUS.CANCELLED) {
        return 'Cancelled'
    }

    if (status.startsWith(CHALLENGE_STATUS.CANCELLED) && status !== CHALLENGE_STATUS.CANCELLED) {
        const reason = status.replace(`${CHALLENGE_STATUS.CANCELLED}_`, '')
        return `Cancelled: ${startCase(toLower(reason))}`
    }

    return startCase(toLower(status))
}

export const ChallengesFilter: FC<ChallengesFilterProps> = (props: ChallengesFilterProps) => {
    const challengeTypes: ChallengeType[] = props.challengeTypes
    const dashboardMode: boolean = !!props.dashboardMode
    const filters: ChallengeFilters = props.filters
    const isLoadingChallengeTypes: boolean = !!props.isLoadingChallengeTypes
    const onFiltersChange: (newFilters: ChallengeFilters) => void = props.onFiltersChange

    const [nameInput, setNameInput] = useState<string>(filters.name || '')
    const isFirstDebouncedRender = useRef<boolean>(true)

    useEffect(() => {
        setNameInput(filters.name || '')
    }, [filters.name])

    useEffect(() => {
        if (isFirstDebouncedRender.current) {
            isFirstDebouncedRender.current = false
            return undefined
        }

        const timeout = window.setTimeout(() => {
            if ((filters.name || '') !== nameInput) {
                onFiltersChange({
                    ...filters,
                    name: nameInput || undefined,
                })
            }
        }, 350)

        return () => {
            window.clearTimeout(timeout)
        }
    }, [filters, nameInput, onFiltersChange])

    const statusOptions = useMemo<SelectOption[]>(
        () => [
            {
                label: 'All statuses',
                value: '',
            },
            ...Object.values(CHALLENGE_STATUS)
                .map(status => ({
                    label: getStatusLabel(status),
                    value: status,
                })),
        ],
        [],
    )

    const challengeTypeOptions = useMemo<SelectOption[]>(
        () => [
            {
                label: 'All challenge types',
                value: '',
            },
            ...challengeTypes.map(type => ({
                label: type.name,
                value: type.abbreviation,
            })),
        ],
        [challengeTypes],
    )

    const projectSelectOptions = useMemo<SelectOption[]>(
        () => {
            const options: SelectOption[] = [
                {
                    label: 'All projects',
                    value: '',
                },
            ]

            if (props.projectOptions?.length) {
                options.push(...props.projectOptions)
            }

            return options
        },
        [props.projectOptions],
    )

    const selectedStatusValue = Array.isArray(filters.status)
        ? (filters.status[0] || '')
        : (filters.status || '')
    const selectedTypeValue = filters.type || ''
    const selectedProjectValue = String(filters.projectId || '')
    const containerClassName = dashboardMode
        ? styles.container
        : `${styles.container} ${styles.projectMode}`

    const selectedStatus: SelectOption | undefined = statusOptions.find(
        option => option.value === selectedStatusValue,
    )

    const selectedType: SelectOption | undefined = challengeTypeOptions.find(
        option => option.value === selectedTypeValue,
    )

    const selectedProject: SelectOption | undefined = projectSelectOptions.find(
        option => option.value === selectedProjectValue,
    )

    function updateFilters(partial: Partial<ChallengeFilters>): void {
        onFiltersChange({
            ...filters,
            ...partial,
        })
    }

    function handleSearchInputChange(event: ChangeEvent<HTMLInputElement>): void {
        setNameInput(event.target.value)
    }

    function handleStatusChange(option: SingleValue<SelectOption>): void {
        updateFilters({
            status: option?.value || undefined,
        })
    }

    function handleTypeChange(option: SingleValue<SelectOption>): void {
        updateFilters({
            type: option?.value || undefined,
        })
    }

    function handleProjectChange(option: SingleValue<SelectOption>): void {
        updateFilters({
            projectId: option?.value || undefined,
        })
    }

    function handleStartDateStartChange(date: Date | null): void {
        updateFilters({
            startDateStart: toIsoDateString(date || undefined),
        })
    }

    function handleStartDateEndChange(date: Date | null): void {
        updateFilters({
            startDateEnd: toIsoDateString(date || undefined),
        })
    }

    function handleEndDateStartChange(date: Date | null): void {
        updateFilters({
            endDateStart: toIsoDateString(date || undefined),
        })
    }

    function handleEndDateEndChange(date: Date | null): void {
        updateFilters({
            endDateEnd: toIsoDateString(date || undefined),
        })
    }

    function handleResetFilters(): void {
        setNameInput('')
        onFiltersChange({
            ...filters,
            endDateEnd: undefined,
            endDateStart: undefined,
            name: undefined,
            projectId: undefined,
            startDateEnd: undefined,
            startDateStart: undefined,
            status: undefined,
            type: undefined,
        })
    }

    return (
        <div className={containerClassName}>
            <div className={`${styles.filterField} ${styles.searchField}`}>
                <label htmlFor='work-challenges-search'>Search</label>
                <div className={styles.searchInputWrap}>
                    <IconOutline.SearchIcon className={styles.searchIcon} />
                    <input
                        id='work-challenges-search'
                        aria-label='Search challenges by name'
                        className={styles.searchInput}
                        onChange={handleSearchInputChange}
                        placeholder='Search challenge name'
                        type='text'
                        value={nameInput}
                    />
                </div>
            </div>

            <div className={`${styles.filterField} ${styles.statusField}`}>
                <label htmlFor='work-challenges-status'>Status</label>
                <Select
                    inputId='work-challenges-status'
                    className='react-select-container'
                    classNamePrefix='select'
                    options={statusOptions}
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    isClearable
                />
            </div>

            <div className={`${styles.filterField} ${styles.typeField}`}>
                <label htmlFor='work-challenges-type'>Type</label>
                <Select
                    inputId='work-challenges-type'
                    className='react-select-container'
                    classNamePrefix='select'
                    options={challengeTypeOptions}
                    value={selectedType}
                    onChange={handleTypeChange}
                    isClearable
                    isLoading={isLoadingChallengeTypes}
                />
            </div>

            {dashboardMode && (
                <div className={styles.filterField}>
                    <label htmlFor='work-challenges-project'>Project</label>
                    <Select
                        inputId='work-challenges-project'
                        className='react-select-container'
                        classNamePrefix='select'
                        options={projectSelectOptions}
                        value={selectedProject}
                        onChange={handleProjectChange}
                        isClearable
                    />
                </div>
            )}

            <div className={`${styles.filterField} ${styles.startDateFromField}`}>
                <InputDatePicker
                    label='Start date from'
                    date={toDate(filters.startDateStart)}
                    disabled={false}
                    maxDate={toDate(filters.startDateEnd)}
                    onChange={handleStartDateStartChange}
                    classNameWrapper={styles.datePicker}
                    isClearable
                />
            </div>

            <div className={`${styles.filterField} ${styles.startDateToField}`}>
                <InputDatePicker
                    label='Start date to'
                    date={toDate(filters.startDateEnd)}
                    disabled={false}
                    minDate={toDate(filters.startDateStart)}
                    onChange={handleStartDateEndChange}
                    classNameWrapper={styles.datePicker}
                    isClearable
                />
            </div>

            <div className={`${styles.filterField} ${styles.endDateFromField}`}>
                <InputDatePicker
                    label='End date from'
                    date={toDate(filters.endDateStart)}
                    disabled={false}
                    maxDate={toDate(filters.endDateEnd)}
                    onChange={handleEndDateStartChange}
                    classNameWrapper={styles.datePicker}
                    isClearable
                />
            </div>

            <div className={`${styles.filterField} ${styles.endDateToField}`}>
                <InputDatePicker
                    label='End date to'
                    date={toDate(filters.endDateEnd)}
                    disabled={false}
                    minDate={toDate(filters.endDateStart)}
                    onChange={handleEndDateEndChange}
                    classNameWrapper={styles.datePicker}
                    isClearable
                />
            </div>

            <div className={`${styles.actions} ${styles.actionsField}`}>
                <Button
                    secondary
                    size='lg'
                    icon={IconOutline.XIcon}
                    iconToLeft
                    label='Reset Filters'
                    onClick={handleResetFilters}
                />
            </div>
        </div>
    )
}

export default ChallengesFilter
