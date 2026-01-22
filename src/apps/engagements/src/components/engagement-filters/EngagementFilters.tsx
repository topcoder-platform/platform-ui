import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import {
    Button,
    FormDefinition,
    FormGroups,
    FormInputModel,
    FormInputRow,
    InputMultiselect,
    InputMultiselectOption,
} from '~/libs/ui'
import { InputSkillSelector } from '~/libs/shared'
import { SearchUserSkill, useCountryLookup } from '~/libs/core'

import styles from './EngagementFilters.module.scss'

const ANY_LOCATION = 'Any'

export interface FilterState {
    search?: string
    skills?: SearchUserSkill[]
    countries?: string[]
}

interface EngagementFiltersProps {
    onFilterChange: (filters: FilterState) => void
    filters: FilterState
}

const EngagementFilters: FC<EngagementFiltersProps> = (props: EngagementFiltersProps) => {
    const filters = props.filters
    const onFilterChange = props.onFilterChange
    const [searchValue, setSearchValue] = useState<string>(filters.search ?? '')
    const countryLookup = useCountryLookup()

    useEffect(() => {
        setSearchValue(filters.search ?? '')
    }, [filters.search])

    useEffect(() => {
        const handler = setTimeout(() => {
            const trimmedSearch = searchValue.trim()
            if ((filters.search ?? '') !== trimmedSearch) {
                onFilterChange({
                    ...filters,
                    search: trimmedSearch || undefined,
                })
            }
        }, 300)

        return () => clearTimeout(handler)
    }, [filters, onFilterChange, searchValue])

    const countryOptions = useMemo(() => {
        const options = (countryLookup ?? [])
            .map(country => ({
                label: country.country,
                value: country.country,
            }))
            .filter(option => (
                option.value && option.value.toLowerCase() !== ANY_LOCATION.toLowerCase()
            ))

        const sortedOptions = options.sort((a, b) => a.label.localeCompare(b.label))

        return [
            { label: ANY_LOCATION, value: ANY_LOCATION },
            ...sortedOptions,
        ]
    }, [countryLookup])

    const fetchCountryOptions = useCallback(async (query: string): Promise<InputMultiselectOption[]> => {
        if (!query) {
            return countryOptions
        }

        const normalizedQuery = query.toLowerCase()
        return countryOptions.filter(option => {
            const normalizedLabel = option.label?.toString()
                .toLowerCase()

            return normalizedLabel?.includes(normalizedQuery)
        })
    }, [countryOptions])

    const selectedCountries = useMemo(() => (
        (filters.countries ?? []).map(country => ({
            label: country,
            value: country,
        }))
    ), [filters.countries])

    const selectedSkills = useMemo(() => (
        filters.skills ?? []
    ), [filters.skills])

    const searchInput: FormInputModel = useMemo(() => ({
        forceUpdateValue: true,
        label: 'Search',
        name: 'search',
        placeholder: 'Search engagements',
        type: 'text',
        value: searchValue,
    } as FormInputModel & { forceUpdateValue?: boolean }), [searchValue])

    const searchFormDef: FormDefinition = useMemo(() => ({
        buttons: {
            primaryGroup: [],
        },
        groups: [
            {
                inputs: [searchInput],
            },
        ],
        groupsOptions: {
            renderGroupDividers: false,
        },
    }), [searchInput])

    const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSearchValue(event.target.value)
    }, [])

    const handleSkillsChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const options = event.target.value as unknown as InputMultiselectOption[]
        const skills = options.map(option => ({
            id: option.value,
            name: typeof option.label === 'string' ? option.label : option.value,
        }))

        onFilterChange({
            ...filters,
            search: searchValue.trim() || undefined,
            skills,
        })
    }, [filters, onFilterChange, searchValue])

    const handleCountriesChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const options = event.target.value as unknown as InputMultiselectOption[]
        const countries = options.map(option => option.value)

        onFilterChange({
            ...filters,
            countries,
            search: searchValue.trim() || undefined,
        })
    }, [filters, onFilterChange, searchValue])

    const handleClearFilters = useCallback(() => {
        setSearchValue('')
        onFilterChange({
            countries: [],
            search: '',
            skills: [],
        })
    }, [onFilterChange])

    const handleSearchBlur = useCallback(() => undefined, [])

    return (
        <div className={styles.filters}>
            <div className={styles.filterGrid}>
                <div className={styles.field}>
                    <FormGroups
                        formDef={searchFormDef}
                        inputs={[searchInput]}
                        onBlur={handleSearchBlur}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className={styles.field}>
                    <FormInputRow index={0} input={{ name: 'skills', type: 'text' }}>
                        <InputSkillSelector
                            className={styles.filterMultiselect}
                            label='Skills'
                            placeholder='Filter by skills'
                            value={selectedSkills}
                            onChange={handleSkillsChange}
                        />
                    </FormInputRow>
                </div>
                <div className={styles.field}>
                    <FormInputRow index={1} input={{ name: 'countries', type: 'text' }}>
                        <InputMultiselect
                            className={styles.filterMultiselect}
                            label='Location'
                            name='countries'
                            placeholder='Select countries'
                            onFetchOptions={fetchCountryOptions}
                            onChange={handleCountriesChange}
                            value={selectedCountries}
                        />
                    </FormInputRow>
                </div>
            </div>
            <div className={styles.actions}>
                <Button
                    label='Clear Filters'
                    onClick={handleClearFilters}
                    secondary
                />
            </div>
        </div>
    )
}

export default EngagementFilters
