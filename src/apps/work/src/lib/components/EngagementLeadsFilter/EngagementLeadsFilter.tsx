import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useState,
} from 'react'

import { Button } from '~/libs/ui'

import {
    EngagementLeadStatus,
    EngagementModel,
    ExperienceLevel,
    LeadPriority,
} from '../../models/EngagementLead.model'

import styles from './EngagementLeadsFilter.module.scss'

export interface EngagementLeadsListFilters {
    accountName?: string
    engagementModel?: string
    experienceLevel?: string
    priority?: string
    roleTitle?: string
    smu?: string
    sortBy?: 'createdAt' | 'preferredStartDate' | 'priority'
    sortOrder?: 'asc' | 'desc'
    statusGroup?: string
}

interface EngagementLeadsFilterProps {
    filters: EngagementLeadsListFilters
    onFiltersChange: (patch: Partial<EngagementLeadsListFilters>) => void
}

export const EngagementLeadsFilter: FC<EngagementLeadsFilterProps> = (
    props: EngagementLeadsFilterProps,
) => {
    const filters = props.filters
    const onFiltersChange = props.onFiltersChange

    const [accountNameInput, setAccountNameInput] = useState<string>(filters.accountName || '')
    const [smuInput, setSmuInput] = useState<string>(filters.smu || '')
    const [roleTitleInput, setRoleTitleInput] = useState<string>(filters.roleTitle || '')
    const [engagementModel, setEngagementModel] = useState<string>(filters.engagementModel || '')
    const [experienceLevel, setExperienceLevel] = useState<string>(filters.experienceLevel || '')
    const [priority, setPriority] = useState<string>(filters.priority || '')
    const [statusGroup, setStatusGroup] = useState<string>(filters.statusGroup || '')

    useEffect(() => {
        setAccountNameInput(filters.accountName || '')
    }, [filters.accountName])

    useEffect(() => {
        setSmuInput(filters.smu || '')
    }, [filters.smu])

    useEffect(() => {
        setRoleTitleInput(filters.roleTitle || '')
    }, [filters.roleTitle])

    useEffect(() => {
        setEngagementModel(filters.engagementModel || '')
    }, [filters.engagementModel])

    useEffect(() => {
        setExperienceLevel(filters.experienceLevel || '')
    }, [filters.experienceLevel])

    useEffect(() => {
        setPriority(filters.priority || '')
    }, [filters.priority])

    useEffect(() => {
        setStatusGroup(filters.statusGroup || '')
    }, [filters.statusGroup])

    const handleSelectChange = useCallback((
        field: 'engagementModel' | 'experienceLevel' | 'priority' | 'statusGroup',
    ) => (event: ChangeEvent<HTMLSelectElement>): void => {
        const nextValue = event.target.value

        switch (field) {
            case 'engagementModel':
                setEngagementModel(nextValue)
                break
            case 'experienceLevel':
                setExperienceLevel(nextValue)
                break
            case 'priority':
                setPriority(nextValue)
                break
            case 'statusGroup':
                setStatusGroup(nextValue)
                break
            default:
                break
        }
    }, [])

    const handleApplyFilters = useCallback((): void => {
        onFiltersChange({
            accountName: accountNameInput.trim() || undefined,
            engagementModel: engagementModel || undefined,
            experienceLevel: experienceLevel || undefined,
            priority: priority || undefined,
            roleTitle: roleTitleInput.trim() || undefined,
            smu: smuInput.trim() || undefined,
            statusGroup: statusGroup || undefined,
        })
    }, [
        accountNameInput,
        engagementModel,
        experienceLevel,
        onFiltersChange,
        priority,
        roleTitleInput,
        smuInput,
        statusGroup,
    ])

    const handleClearFilters = useCallback((): void => {
        setAccountNameInput('')
        setSmuInput('')
        setRoleTitleInput('')
        setEngagementModel('')
        setExperienceLevel('')
        setPriority('')
        setStatusGroup('')
        onFiltersChange({
            accountName: undefined,
            engagementModel: undefined,
            experienceLevel: undefined,
            priority: undefined,
            roleTitle: undefined,
            smu: undefined,
            statusGroup: undefined,
        })
    }, [onFiltersChange])

    const handleAccountNameChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setAccountNameInput(event.target.value)
    }, [])

    const handleSmuChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setSmuInput(event.target.value)
    }, [])

    const handleRoleTitleChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        setRoleTitleInput(event.target.value)
    }, [])

    return (
        <div className={styles.container}>
            <div className={styles.grid}>
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
                    <input
                        className={styles.input}
                        placeholder='Search SMU'
                        value={smuInput}
                        onChange={handleSmuChange}
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>Engagement Model</span>
                    <select
                        className={styles.select}
                        value={engagementModel}
                        onChange={handleSelectChange('engagementModel')}
                    >
                        <option value=''>All models</option>
                        <option value={EngagementModel.TIME_AND_MATERIAL}>Time & Material</option>
                        <option value={EngagementModel.FIXED_PRICE}>Fixed Price</option>
                    </select>
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>Role Title</span>
                    <input
                        className={styles.input}
                        placeholder='Search role title'
                        value={roleTitleInput}
                        onChange={handleRoleTitleChange}
                    />
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>Experience Level</span>
                    <select
                        className={styles.select}
                        value={experienceLevel}
                        onChange={handleSelectChange('experienceLevel')}
                    >
                        <option value=''>All levels</option>
                        <option value={ExperienceLevel.JUNIOR}>Junior</option>
                        <option value={ExperienceLevel.MID}>Mid</option>
                        <option value={ExperienceLevel.SENIOR}>Senior</option>
                        <option value={ExperienceLevel.LEAD_ARCHITECT}>Lead / Architect</option>
                    </select>
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>Priority</span>
                    <select
                        className={styles.select}
                        value={priority}
                        onChange={handleSelectChange('priority')}
                    >
                        <option value=''>All priorities</option>
                        <option value={LeadPriority.CRITICAL}>Critical</option>
                        <option value={LeadPriority.HIGH}>High</option>
                        <option value={LeadPriority.MEDIUM}>Medium</option>
                        <option value={LeadPriority.LOW}>Low</option>
                    </select>
                </label>

                <label className={styles.field}>
                    <span className={styles.label}>Status</span>
                    <select
                        className={styles.select}
                        value={statusGroup}
                        onChange={handleSelectChange('statusGroup')}
                    >
                        <option value=''>All statuses</option>
                        <option value='NEW'>New</option>
                        <option value={EngagementLeadStatus.CONVERTED}>Converted</option>
                        <option value='DECLINED'>Declined</option>
                    </select>
                </label>
            </div>

            <div className={styles.actions}>
                <Button label='Apply Filters' onClick={handleApplyFilters} primary size='md' />
                <Button label='Clear Filters' onClick={handleClearFilters} secondary size='md' />
            </div>
        </div>
    )
}

export default EngagementLeadsFilter
