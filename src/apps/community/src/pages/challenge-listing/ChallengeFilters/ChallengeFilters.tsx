import { ChangeEvent, FC, FocusEvent, useCallback, useMemo } from 'react'

import { Button, FormToggleSwitch, IconOutline } from '~/libs/ui'

import styles from './ChallengeFilters.module.scss'

export enum SidebarBucket {
    All = 'all',
    MyChallenges = 'my-challenges',
    OpenForRegistration = 'open-for-registration',
    OpenForReview = 'open-for-review',
    CopilotOpportunities = 'copilot-opportunities',
}

export const SIDEBAR_BUCKET_LABELS: Record<SidebarBucket, string> = {
    [SidebarBucket.All]: 'All',
    [SidebarBucket.MyChallenges]: 'My Challenges',
    [SidebarBucket.OpenForRegistration]: 'Open for Registration',
    [SidebarBucket.OpenForReview]: 'Open for Review',
    [SidebarBucket.CopilotOpportunities]: 'Copilot Opportunities',
}

interface ToggleOption {
    key: string
    label: string
}

const TRACK_OPTIONS: ReadonlyArray<ToggleOption> = [
    { key: 'Design', label: 'Design' },
    { key: 'Development', label: 'Development' },
    { key: 'DataScience', label: 'Data Science' },
    { key: 'QA', label: 'QA' },
]

const TYPE_OPTIONS: ReadonlyArray<ToggleOption> = [
    { key: 'Challenge', label: 'Challenge' },
    { key: 'First2Finish', label: 'First2Finish' },
    { key: 'MarathonMatch', label: 'Marathon Match' },
    { key: 'Task', label: 'Task' },
]

export interface ChallengeFiltersProps {
    activeBucket: SidebarBucket
    isLoggedIn: boolean
    onBucketChange: (bucket: SidebarBucket) => void
    onClear: () => void
    onSearchChange: (value: string) => void
    onTrackToggle: (track: string, on: boolean) => void
    onTypeToggle: (type: string, on: boolean) => void
    search: string
    tracks: Record<string, boolean>
    types: Record<string, boolean>
}

/**
 * Left sidebar filter controls for challenge listing.
 *
 * @param props Sidebar filter values and change handlers.
 * @returns Sidebar with search, bucket radios, category/type toggles and reset action.
 */
const ChallengeFilters: FC<ChallengeFiltersProps> = (props: ChallengeFiltersProps) => {
    const handleSearchChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            props.onSearchChange(event.target.value)
        },
        [props.onSearchChange],
    )

    const handleBucketChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            props.onBucketChange(event.target.value as SidebarBucket)
        },
        [props.onBucketChange],
    )
    const trackToggleHandlers = useMemo(() => {
        const handlers: Record<string, (event: FocusEvent<HTMLInputElement>) => void> = {}
        TRACK_OPTIONS.forEach(option => {
            handlers[option.key] = (event: FocusEvent<HTMLInputElement>) => {
                props.onTrackToggle(option.key, event.target.checked)
            }
        })

        return handlers
    }, [props.onTrackToggle])
    const typeToggleHandlers = useMemo(() => {
        const handlers: Record<string, (event: FocusEvent<HTMLInputElement>) => void> = {}
        TYPE_OPTIONS.forEach(option => {
            handlers[option.key] = (event: FocusEvent<HTMLInputElement>) => {
                props.onTypeToggle(option.key, event.target.checked)
            }
        })

        return handlers
    }, [props.onTypeToggle])

    return (
        <aside className={styles.sidebar}>
            <div className={styles.section}>
                <div className={styles.search}>
                    <IconOutline.SearchIcon className={styles.searchIcon} aria-hidden />
                    <input
                        aria-label='Search active'
                        className={styles.searchInput}
                        name='challenge-sidebar-search'
                        onChange={handleSearchChange}
                        placeholder='Search active'
                        type='text'
                        value={props.search}
                    />
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.radioList}>
                    {Object.values(SidebarBucket)
                        .filter(bucket => props.isLoggedIn || bucket !== SidebarBucket.MyChallenges)
                        .map(bucket => (
                            <label className={styles.radioItem} key={bucket}>
                                <input
                                    checked={props.activeBucket === bucket}
                                    name='challenge-sidebar-bucket'
                                    onChange={handleBucketChange}
                                    type='radio'
                                    value={bucket}
                                />
                                <span>{SIDEBAR_BUCKET_LABELS[bucket]}</span>
                            </label>
                        ))}
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.heading}>Category</h3>
                <div className={styles.categoryGrid}>
                    {TRACK_OPTIONS.map(option => (
                        <div className={styles.toggleItem} key={option.key}>
                            <FormToggleSwitch
                                name={`track-${option.key}`}
                                onChange={trackToggleHandlers[option.key]}
                                value={Boolean(props.tracks[option.key])}
                            />
                            <span className={styles.toggleLabel}>{option.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.heading}>Type</h3>
                <div className={styles.typeList}>
                    {TYPE_OPTIONS.map(option => (
                        <div className={styles.toggleItem} key={option.key}>
                            <FormToggleSwitch
                                name={`type-${option.key}`}
                                onChange={typeToggleHandlers[option.key]}
                                value={Boolean(props.types[option.key])}
                            />
                            <span className={styles.toggleLabel}>{option.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <Button
                fullWidth
                label='Reset filters'
                onClick={props.onClear}
                secondary
            />
        </aside>
    )
}

export default ChallengeFilters
