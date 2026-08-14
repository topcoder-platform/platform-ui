/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind */
import { ChangeEvent, FC } from 'react'
import classNames from 'classnames'

import { OpportunityKind } from '../models'

import { ReactComponent as SearchIcon } from '../assets/filter-search.svg'
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
    onTypeChange: (type: string, checked: boolean) => void
    search: string
    status: string
    tracks: string[]
    types: string[]
}

interface FacetOption {
    label: string
    value: string
}

const TRACKS: Record<OpportunityKind, FacetOption[]> = {
    competitions: [
        { label: 'Design', value: 'Des' },
        { label: 'Development', value: 'Dev' },
        { label: 'Data Science', value: 'DS' },
        { label: 'QA', value: 'QA' },
    ],
    copilots: [
        { label: 'Design', value: 'design' },
        { label: 'Development', value: 'dev' },
        { label: 'Data Science', value: 'datascience' },
        { label: 'QA', value: 'qa' },
        { label: 'AI', value: 'ai' },
    ],
    engagements: [],
    reviews: [
        { label: 'Design', value: 'Design' },
        { label: 'Development', value: 'Development' },
        { label: 'Data Science', value: 'Data Science' },
        { label: 'QA', value: 'Quality Assurance' },
        { label: 'AI', value: 'AI' },
    ],
}

const COMPETITION_TYPES: FacetOption[] = [
    { label: 'Challenge', value: 'CH' },
    { label: 'First2Finish', value: 'F2F' },
    { label: 'Marathon Match', value: 'MM' },
    { label: 'Task', value: 'TSK' },
]

const REVIEW_TYPES: FacetOption[] = [
    { label: 'Challenge', value: 'Challenge' },
    { label: 'Task', value: 'Task' },
]

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
        { label: 'Completed', value: kind === 'reviews' || kind === 'engagements' ? 'CLOSED' : 'COMPLETED' },
    ]
}

/**
 * Renders the server-backed filter controls shown beside each Opportunities list.
 *
 * @param props current filters and callbacks that reset pagination before refetching.
 * @returns accessible domain-specific search, skills, ownership, status, track, and type controls.
 * @throws Does not throw.
 */
export const OpportunityFiltersPanel: FC<OpportunityFiltersPanelProps> = props => {
    const tracks = TRACKS[props.kind]
    const statuses = statusOptions(props.kind)
    const searchDescriptionId = `${props.kind}-search-description`

    /** Updates the controlled search string. */
    const handleSearch = (event: ChangeEvent<HTMLInputElement>): void => props.onSearchChange(event.target.value)

    return (
        <aside
            aria-label='Opportunity filters'
            className={classNames(styles.panel, {
                [styles.competitions]: props.kind === 'competitions',
            })}
        >
            <div className={styles.heading}>
                <h3>Filters</h3>
                <button onClick={props.onReset} type='button'>Reset all</button>
            </div>
            <div className={styles.searchGroup}>
                <label className={styles.search}>
                    <span className={styles.visuallyHidden}>Search opportunities</span>
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
            {tracks.length > 0 && (
                <fieldset>
                    <legend>Track</legend>
                    {tracks.map((track: FacetOption) => (
                        <label className={styles.checkRow} key={track.value}>
                            <input
                                checked={props.tracks.includes(track.value)}
                                onChange={event => props.onTrackChange(track.value, event.target.checked)}
                                type='checkbox'
                            />
                            <span>{track.label}</span>
                        </label>
                    ))}
                </fieldset>
            )}
            {props.kind === 'competitions' && (
                <fieldset>
                    <legend>Type</legend>
                    {COMPETITION_TYPES.map((type: FacetOption) => (
                        <label className={styles.checkRow} key={type.value}>
                            <input
                                checked={props.types.includes(type.value)}
                                onChange={event => props.onTypeChange(type.value, event.target.checked)}
                                type='checkbox'
                            />
                            <span>{type.label}</span>
                        </label>
                    ))}
                </fieldset>
            )}
            {props.kind === 'reviews' && (
                <fieldset>
                    <legend>Type</legend>
                    {REVIEW_TYPES.map((type: FacetOption) => (
                        <label className={styles.checkRow} key={type.value}>
                            <input
                                checked={props.types.includes(type.value)}
                                onChange={event => props.onTypeChange(type.value, event.target.checked)}
                                type='checkbox'
                            />
                            <span>{type.label}</span>
                        </label>
                    ))}
                </fieldset>
            )}
        </aside>
    )
}
