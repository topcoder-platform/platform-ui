import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import { Button, InputMultiselect, InputMultiselectOption } from '~/libs/ui'

import { LEAD_SMU_OPTIONS } from '../../constants'
import {
    EngagementLeadStatusGroup,
    EngagementLeadType,
} from '../../models/EngagementLead.model'

import styles from './EngagementLeadsFilter.module.scss'

export interface EngagementLeadsListFilters {
    accountName?: string
    roleTitle?: string
    smu?: string
    sortBy?: 'createdAt' | 'preferredStartDate'
    sortOrder?: 'asc' | 'desc'
    /** Empty or unset shows leads in every status. */
    statusGroups?: string[]
}

interface EngagementLeadsFilterProps {
    filters: EngagementLeadsListFilters
    leadType: EngagementLeadType
    onFiltersChange: (patch: Partial<EngagementLeadsListFilters>) => void
}

// The Leads page opens on the leads that still need work: new ones and the ones under review.
export const DEFAULT_STATUS_GROUPS: string[] = [
    EngagementLeadStatusGroup.NEW,
    EngagementLeadStatusGroup.IN_PROGRESS,
]

export const DEFAULT_FILTERS: EngagementLeadsListFilters = {
    sortBy: 'createdAt',
    sortOrder: 'desc',
    statusGroups: DEFAULT_STATUS_GROUPS,
}

export const LEAD_STATUS_GROUP_OPTIONS: InputMultiselectOption[] = [
    { label: 'New', value: EngagementLeadStatusGroup.NEW },
    { label: 'In Progress', value: EngagementLeadStatusGroup.IN_PROGRESS },
    { label: 'Converted', value: EngagementLeadStatusGroup.CONVERTED },
    { label: 'Declined', value: EngagementLeadStatusGroup.DECLINED },
]

/**
 * Normalizes the selected status groups for the applied filters.
 * @param statusGroups Selected status group values.
 * @returns undefined when nothing or everything is selected, as both mean every status.
 */
function normalizeStatusGroups(statusGroups: string[]): string[] | undefined {
    if (!statusGroups.length || statusGroups.length === LEAD_STATUS_GROUP_OPTIONS.length) {
        return undefined
    }

    return statusGroups
}

export const EngagementLeadsFilter: FC<EngagementLeadsFilterProps> = (
    props: EngagementLeadsFilterProps,
) => {
    const filters = props.filters
    const onFiltersChange = props.onFiltersChange
    // Wipro Direct leads have no role title, so filtering on it would only ever hide them.
    const showRoleTitle = props.leadType === EngagementLeadType.WIPRO_CONSUMPTION

    const [accountNameInput, setAccountNameInput] = useState<string>(filters.accountName || '')
    const [smu, setSmu] = useState<string>(filters.smu || '')
    const [roleTitleInput, setRoleTitleInput] = useState<string>(filters.roleTitle || '')
    const [statusGroups, setStatusGroups] = useState<string[]>(filters.statusGroups || [])

    useEffect(() => {
        setAccountNameInput(filters.accountName || '')
    }, [filters.accountName])

    useEffect(() => {
        setSmu(filters.smu || '')
    }, [filters.smu])

    useEffect(() => {
        setRoleTitleInput(filters.roleTitle || '')
    }, [filters.roleTitle])

    useEffect(() => {
        setStatusGroups(filters.statusGroups || [])
    }, [filters.statusGroups])

    const selectedStatusOptions = useMemo<InputMultiselectOption[]>(
        () => LEAD_STATUS_GROUP_OPTIONS.filter(option => statusGroups.includes(option.value)),
        [statusGroups],
    )

    const handleApplyFilters = useCallback((): void => {
        onFiltersChange({
            accountName: accountNameInput.trim() || undefined,
            roleTitle: showRoleTitle ? roleTitleInput.trim() || undefined : undefined,
            smu: smu || undefined,
            statusGroups: normalizeStatusGroups(statusGroups),
        })
    }, [
        accountNameInput,
        onFiltersChange,
        roleTitleInput,
        showRoleTitle,
        smu,
        statusGroups,
    ])

    const handleClearFilters = useCallback((): void => {
        setAccountNameInput(DEFAULT_FILTERS.accountName || '')
        setRoleTitleInput(DEFAULT_FILTERS.roleTitle || '')
        setSmu(DEFAULT_FILTERS.smu || '')
        setStatusGroups(DEFAULT_FILTERS.statusGroups || [])
        onFiltersChange({
            accountName: DEFAULT_FILTERS.accountName || undefined,
            roleTitle: DEFAULT_FILTERS.roleTitle || undefined,
            smu: DEFAULT_FILTERS.smu || undefined,
            statusGroups: DEFAULT_FILTERS.statusGroups,
        })
    }, [onFiltersChange])

    const handleAccountNameChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setAccountNameInput(event.target.value)
    }, [])

    const handleSmuChange = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
        setSmu(event.target.value)
    }, [])

    const handleRoleTitleChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setRoleTitleInput(event.target.value)
    }, [])

    const handleStatusGroupsChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        const options = (event.target.value || []) as unknown as InputMultiselectOption[]
        setStatusGroups(options.map(option => option.value)
            .filter(Boolean))
    }, [])

    const fetchStatusOptions = useCallback(async (query: string): Promise<InputMultiselectOption[]> => {
        const normalizedQuery = query.trim()
            .toLowerCase()

        return LEAD_STATUS_GROUP_OPTIONS.filter(option => String(option.label)
            .toLowerCase()
            .includes(normalizedQuery))
    }, [])

    return (
        <div className={styles.container}>
            <label className={styles.field}>
                <span className={styles.label}>Account / Customer</span>
                <input
                    className={styles.input}
                    placeholder='Search account name'
                    value={accountNameInput}
                    onChange={handleAccountNameChange}
                />
            </label>

            <label className={styles.field}>
                <span className={styles.label}>SMU</span>
                <select
                    className={styles.select}
                    value={smu}
                    onChange={handleSmuChange}
                >
                    <option value=''>All SMUs</option>
                    {LEAD_SMU_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </label>

            {showRoleTitle && (
                <label className={styles.field}>
                    <span className={styles.label}>Role Title</span>
                    <input
                        className={styles.input}
                        placeholder='Search role title'
                        value={roleTitleInput}
                        onChange={handleRoleTitleChange}
                    />
                </label>
            )}

            <div className={styles.field}>
                <span className={styles.label}>Status</span>
                <InputMultiselect
                    className={styles.statusMultiselect}
                    label='Lead Status'
                    name='engagement-leads-status'
                    openMenuOnClick
                    options={LEAD_STATUS_GROUP_OPTIONS}
                    onFetchOptions={fetchStatusOptions}
                    onChange={handleStatusGroupsChange}
                    placeholder='All statuses'
                    value={selectedStatusOptions}
                />
            </div>

            <div className={styles.actions}>
                <Button label='Apply Filters' onClick={handleApplyFilters} primary size='md' />
                <Button label='Clear Filters' onClick={handleClearFilters} secondary size='md' />
            </div>
        </div>
    )
}

export default EngagementLeadsFilter
