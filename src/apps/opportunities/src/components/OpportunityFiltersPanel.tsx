/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind */
import { ChangeEvent, FC } from 'react'
import { IconOutline } from '~/libs/ui'

import { OpportunityKind } from '../models'

import styles from './OpportunityFiltersPanel.module.scss'

interface OpportunityFiltersPanelProps {
    applied: boolean
    isAuthenticated: boolean
    kind: OpportunityKind
    onAppliedChange: (checked: boolean) => void
    onReset: () => void
    onSearchChange: (value: string) => void
    onStatusChange: (status: string) => void
    onTrackChange: (track: string, checked: boolean) => void
    search: string
    status: string
    tracks: string[]
}

const TRACKS = ['Design', 'Development', 'Data Science', 'QA', 'AI']

const MY_LABELS: Record<OpportunityKind, string> = {
    competitions: 'My competitions',
    copilots: 'My copilot opportunities',
    engagements: 'My engagements',
    reviews: 'My review opportunities',
}

interface StatusOption {
    label: string
    value: string
}

/**
 * Returns the status values understood by the active owning API.
 *
 * @param kind opportunity domain.
 * @returns labeled status filter options.
 * @throws Does not throw.
 */
function statusOptions(kind: OpportunityKind): StatusOption[] {
    if (kind === 'competitions') {
        return [
            { label: 'Active competitions', value: 'ACTIVE' },
            { label: 'Open for registration', value: 'REGISTRATION' },
            { label: 'Past competitions', value: 'COMPLETED' },
        ]
    }

    if (kind === 'copilots') {
        return [
            { label: 'Open for application', value: 'active' },
            { label: 'Completed', value: 'completed' },
        ]
    }

    return [
        { label: 'Open for application', value: 'OPEN' },
        { label: 'Completed', value: kind === 'reviews' ? 'CLOSED' : 'COMPLETED' },
    ]
}

/**
 * Renders the server-backed filter controls shown beside each Opportunities list.
 *
 * @param props current filters and callbacks that reset pagination before refetching.
 * @returns accessible search, ownership, status, and track controls.
 * @throws Does not throw.
 */
export const OpportunityFiltersPanel: FC<OpportunityFiltersPanelProps> = props => {
    const showTracks = props.kind !== 'engagements'
    const statuses = statusOptions(props.kind)

    /** Updates the controlled search string. */
    const handleSearch = (event: ChangeEvent<HTMLInputElement>): void => props.onSearchChange(event.target.value)

    return (
        <aside className={styles.panel} aria-label='Opportunity filters'>
            <div className={styles.heading}>
                <h3>Filters</h3>
                <button onClick={props.onReset} type='button'>Reset all</button>
            </div>
            <label className={styles.search}>
                <span className={styles.visuallyHidden}>Search opportunities</span>
                <IconOutline.SearchIcon />
                <input
                    onChange={handleSearch}
                    placeholder='Search'
                    type='search'
                    value={props.search}
                />
            </label>
            <small>Search skills, technologies, projects</small>
            {props.isAuthenticated && (
                <label className={styles.checkRow}>
                    <input
                        checked={props.applied}
                        onChange={event => props.onAppliedChange(event.target.checked)}
                        type='checkbox'
                    />
                    <span>{MY_LABELS[props.kind]}</span>
                </label>
            )}
            <fieldset>
                <legend>Status</legend>
                {statuses.map((option: StatusOption) => (
                    <label className={styles.radioRow} key={option.value}>
                        <input
                            checked={props.status === option.value}
                            name={`${props.kind}-status`}
                            onChange={() => props.onStatusChange(option.value)}
                            type='radio'
                        />
                        <span>{option.label}</span>
                    </label>
                ))}
            </fieldset>
            {showTracks && (
                <fieldset>
                    <legend>Track</legend>
                    {TRACKS.map((track: string) => (
                        <label className={styles.checkRow} key={track}>
                            <input
                                checked={props.tracks.includes(track)}
                                onChange={event => props.onTrackChange(track, event.target.checked)}
                                type='checkbox'
                            />
                            <span>{track}</span>
                        </label>
                    ))}
                </fieldset>
            )}
        </aside>
    )
}
