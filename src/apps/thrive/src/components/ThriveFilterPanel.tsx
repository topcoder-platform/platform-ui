/* eslint-disable react/jsx-no-bind */

import type { FC, FormEvent } from 'react'
import { useEffect, useState } from 'react'

import type { ThriveFilters } from '../models'
import styles from '../Thrive.module.scss'

interface ThriveFilterPanelProps {
    filters: ThriveFilters
    onApply: (filters: Partial<ThriveFilters>) => void
    showTrack?: boolean
}

/**
 * Renders the author, tag, date, track, and sort controls shared by Thrive result pages.
 *
 * @param props active URL filters and a callback that persists changes to the route.
 * @returns a filter form matching the controls from community-app Thrive.
 * @throws Does not throw.
 */
export const ThriveFilterPanel: FC<ThriveFilterPanelProps> = (props: ThriveFilterPanelProps) => {
    const [author, setAuthor] = useState(props.filters.author || '')
    const [endDate, setEndDate] = useState(props.filters.endDate || '')
    const [startDate, setStartDate] = useState(props.filters.startDate || '')
    const [tags, setTags] = useState(props.filters.tags.join(', '))
    const [track, setTrack] = useState(props.filters.track || '')

    useEffect(() => {
        setAuthor(props.filters.author || '')
        setEndDate(props.filters.endDate || '')
        setStartDate(props.filters.startDate || '')
        setTags(props.filters.tags.join(', '))
        setTrack(props.filters.track || '')
    }, [props.filters])

    /**
     * Converts form fields into route-safe filter values.
     *
     * @param event browser form event to prevent from reloading the application.
     * @returns nothing after forwarding the normalized filters.
     * @throws Does not throw.
     */
    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault()
        props.onApply({
            author: author.trim() || undefined,
            endDate: endDate || undefined,
            sortBy: props.filters.sortBy,
            startDate: startDate || undefined,
            tags: tags.split(',')
                .map(tag => tag.trim())
                .filter(Boolean),
            track: track || undefined,
        })
    }

    return (
        <form className={styles.filterPanel} onSubmit={submit}>
            <h3>Filter content</h3>
            {props.showTrack && (
                <label>
                    Track
                    <select onChange={event => setTrack(event.target.value)} value={track}>
                        <option value=''>All tracks</option>
                        <option>Competitive Programming</option>
                        <option>Data Science</option>
                        <option>Design</option>
                        <option>Development</option>
                        <option>QA</option>
                        <option>Gig Work</option>
                        <option>Topcoder</option>
                    </select>
                </label>
            )}
            <label>
                Author
                <input onChange={event => setAuthor(event.target.value)} placeholder='All authors' value={author} />
            </label>
            <label>
                Tags
                <input
                    onChange={event => setTags(event.target.value)}
                    placeholder='Separate tags with commas'
                    value={tags}
                />
            </label>
            <div className={styles.dateFields}>
                <label>
                    From
                    <input onChange={event => setStartDate(event.target.value)} type='date' value={startDate} />
                </label>
                <label>
                    To
                    <input onChange={event => setEndDate(event.target.value)} type='date' value={endDate} />
                </label>
            </div>
            <label>
                Sort by
                <select
                    onChange={event => props.onApply({ sortBy: event.target.value as ThriveFilters['sortBy'] })}
                    value={props.filters.sortBy}
                >
                    <option>Content Publish Date</option>
                    <option>Likes</option>
                </select>
            </label>
            <button className={styles.outlineButton} type='submit'>Apply filters</button>
        </form>
    )
}
