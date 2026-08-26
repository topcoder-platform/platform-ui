/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind */
import { ChangeEvent, FC } from 'react'

import {
    OpportunityKind,
    OpportunityWorkStatus,
} from '../models'

import { ReactComponent as SearchIcon } from '../assets/filter-search.svg'
import styles from './MyWorkFiltersPanel.module.scss'

interface MyWorkFiltersPanelProps {
    kinds: OpportunityKind[]
    onKindChange: (kind: OpportunityKind, checked: boolean) => void
    onReset: () => void
    onSearchChange: (value: string) => void
    onStatusChange: (status: OpportunityWorkStatus) => void
    onTrackChange: (track: string, checked: boolean) => void
    onTypeChange: (type: string, checked: boolean) => void
    search: string
    status: OpportunityWorkStatus
    tracks: string[]
    types: string[]
}

interface WorkFacetOption<T extends string = string> {
    label: string
    value: T
}

const STATUS_OPTIONS: Array<WorkFacetOption<OpportunityWorkStatus>> = [
    { label: 'All work', value: 'all' },
    { label: 'Active work', value: 'active' },
    { label: 'Past work', value: 'past' },
]

const KIND_OPTIONS: Array<WorkFacetOption<OpportunityKind>> = [
    { label: 'Competition', value: 'competitions' },
    { label: 'Engagements', value: 'engagements' },
    { label: 'Copilot work', value: 'copilots' },
    { label: 'Review work', value: 'reviews' },
]

const TRACK_OPTIONS: WorkFacetOption[] = [
    { label: 'Design', value: 'design' },
    { label: 'Development', value: 'development' },
    { label: 'Data Science', value: 'data-science' },
    { label: 'QA', value: 'qa' },
    { label: 'AI', value: 'ai' },
]

const TYPE_OPTIONS: WorkFacetOption[] = [
    { label: 'Challenge', value: 'challenge' },
    { label: 'First2Finish', value: 'first2finish' },
    { label: 'Marathon Match', value: 'marathon-match' },
    { label: 'Gig', value: 'gig' },
    { label: 'Task', value: 'task' },
]

/**
 * Renders the dedicated mixed-domain filters in the authored My Work order.
 *
 * @param props controlled search, lifecycle, domain, track, and type filters.
 * @returns accessible filter panel for the combined member-work result set.
 * @throws Does not throw.
 */
export const MyWorkFiltersPanel: FC<MyWorkFiltersPanelProps> = props => {
    const searchDescriptionId = 'my-work-search-description'

    /**
     * Forwards the controlled search value to the mixed listing.
     *
     * @param event native search-input change event.
     * @returns void.
     * @throws Does not throw.
     */
    const handleSearch = (event: ChangeEvent<HTMLInputElement>): void => {
        props.onSearchChange(event.target.value)
    }

    return (
        <aside aria-label='My Work filters' className={styles.panel}>
            <div className={styles.heading}>
                <h3>Filters</h3>
                <button onClick={props.onReset} type='button'>Reset all</button>
            </div>
            <div className={styles.searchGroup}>
                <label className={styles.search}>
                    <span className={styles.visuallyHidden}>Search my work</span>
                    <SearchIcon aria-hidden='true' />
                    <input
                        aria-describedby={searchDescriptionId}
                        onChange={handleSearch}
                        placeholder='Search'
                        type='search'
                        value={props.search}
                    />
                </label>
                <small id={searchDescriptionId}>Search skills, technologies, projects</small>
            </div>
            <fieldset>
                <legend>Status</legend>
                {STATUS_OPTIONS.map(option => (
                    <label className={styles.radioRow} key={option.value}>
                        <input
                            checked={props.status === option.value}
                            name='my-work-status'
                            onChange={() => props.onStatusChange(option.value)}
                            type='radio'
                        />
                        <span>{option.label}</span>
                    </label>
                ))}
            </fieldset>
            <fieldset>
                <legend>Opportunity type</legend>
                {KIND_OPTIONS.map(option => (
                    <label className={styles.checkRow} key={option.value}>
                        <input
                            checked={props.kinds.includes(option.value)}
                            onChange={event => props.onKindChange(option.value, event.target.checked)}
                            type='checkbox'
                        />
                        <span>{option.label}</span>
                    </label>
                ))}
            </fieldset>
            <fieldset>
                <legend>Track</legend>
                {TRACK_OPTIONS.map(option => (
                    <label className={styles.checkRow} key={option.value}>
                        <input
                            checked={props.tracks.includes(option.value)}
                            onChange={event => props.onTrackChange(option.value, event.target.checked)}
                            type='checkbox'
                        />
                        <span>{option.label}</span>
                    </label>
                ))}
            </fieldset>
            <fieldset>
                <legend>Type</legend>
                {TYPE_OPTIONS.map(option => (
                    <label className={styles.checkRow} key={option.value}>
                        <input
                            checked={props.types.includes(option.value)}
                            onChange={event => props.onTypeChange(option.value, event.target.checked)}
                            type='checkbox'
                        />
                        <span>{option.label}</span>
                    </label>
                ))}
            </fieldset>
        </aside>
    )
}
