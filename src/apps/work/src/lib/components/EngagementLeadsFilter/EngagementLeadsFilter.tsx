import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useState,
} from 'react'

import { Button } from '~/libs/ui'

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
    statusGroup?: string
}

interface EngagementLeadsFilterProps {
    filters: EngagementLeadsListFilters
    leadType: EngagementLeadType
    onFiltersChange: (patch: Partial<EngagementLeadsListFilters>) => void
}

export const DEFAULT_FILTERS: EngagementLeadsListFilters = {
    sortBy: 'createdAt',
    sortOrder: 'desc',
    statusGroup: EngagementLeadStatusGroup.NEW,
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
    const [statusGroup, setStatusGroup] = useState<string>(filters.statusGroup || '')

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
        setStatusGroup(filters.statusGroup || '')
    }, [filters.statusGroup])

    const handleApplyFilters = useCallback((): void => {
        onFiltersChange({
            accountName: accountNameInput.trim() || undefined,
            roleTitle: showRoleTitle ? roleTitleInput.trim() || undefined : undefined,
            smu: smu || undefined,
            statusGroup: statusGroup || undefined,
        })
    }, [
        accountNameInput,
        onFiltersChange,
        roleTitleInput,
        showRoleTitle,
        smu,
        statusGroup,
    ])

    const handleClearFilters = useCallback((): void => {
        setAccountNameInput(DEFAULT_FILTERS.accountName || '')
        setRoleTitleInput(DEFAULT_FILTERS.roleTitle || '')
        setSmu(DEFAULT_FILTERS.smu || '')
        setStatusGroup(DEFAULT_FILTERS.statusGroup || '')
        onFiltersChange({
            accountName: DEFAULT_FILTERS.accountName || undefined,
            roleTitle: DEFAULT_FILTERS.roleTitle || undefined,
            smu: DEFAULT_FILTERS.smu || undefined,
            statusGroup: DEFAULT_FILTERS.statusGroup || undefined,
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

    const handleStatusGroupChange = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
        setStatusGroup(event.target.value)
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

            <label className={styles.field}>
                <span className={styles.label}>Status</span>
                <select
                    className={styles.select}
                    value={statusGroup}
                    onChange={handleStatusGroupChange}
                >
                    <option value=''>All statuses</option>
                    <option value={EngagementLeadStatusGroup.NEW}>New</option>
                    <option value={EngagementLeadStatusGroup.IN_PROGRESS}>In Progress</option>
                    <option value={EngagementLeadStatusGroup.CONVERTED}>Converted</option>
                    <option value={EngagementLeadStatusGroup.DECLINED}>Declined</option>
                </select>
            </label>

            <div className={styles.actions}>
                <Button label='Apply Filters' onClick={handleApplyFilters} primary size='md' />
                <Button label='Clear Filters' onClick={handleClearFilters} secondary size='md' />
            </div>
        </div>
    )
}

export default EngagementLeadsFilter
