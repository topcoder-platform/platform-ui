/* eslint-disable react/jsx-no-bind */

import type { FC, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { THRIVE_ROOT_ROUTE } from '../config'
import styles from '../Thrive.module.scss'

interface ThriveSearchBarProps {
    initialMode?: 'phrase' | 'title'
    initialValue?: string
}

/**
 * Renders the legacy Thrive keyword/title search and drives the Payload-backed search route.
 *
 * @param props optional initial phrase and search mode derived from the current URL.
 * @returns a Thrive search form.
 * @throws Does not throw; blank searches navigate to the unfiltered search page.
 */
export const ThriveSearchBar: FC<ThriveSearchBarProps> = (props: ThriveSearchBarProps) => {
    const navigate = useNavigate()
    const [mode, setMode] = useState<'phrase' | 'title'>(props.initialMode || 'phrase')
    const [value, setValue] = useState(props.initialValue || '')

    useEffect(() => {
        setMode(props.initialMode || 'phrase')
        setValue(props.initialValue || '')
    }, [props.initialMode, props.initialValue])

    /**
     * Submits the current phrase to the canonical Thrive search route.
     *
     * @param event browser form event to prevent from reloading the application.
     * @returns nothing after navigation is requested.
     * @throws Does not throw.
     */
    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault()
        const query = new URLSearchParams()
        if (value.trim()) {
            query.set(mode, value.trim()
                .slice(0, 115))
        }

        navigate(`${THRIVE_ROOT_ROUTE}/search${query.size ? `?${query.toString()}` : ''}`)
    }

    return (
        <form className={styles.searchBar} onSubmit={submit} role='search'>
            <select
                aria-label='Search in'
                onChange={event => setMode(event.target.value as 'phrase' | 'title')}
                value={mode}
            >
                <option value='phrase'>Entire content</option>
                <option value='title'>Title only</option>
            </select>
            <input
                aria-label='Search Thrive'
                maxLength={115}
                onChange={event => setValue(event.target.value)}
                placeholder='Search Thrive'
                type='search'
                value={value}
            />
            <button aria-label='Submit Thrive search' type='submit'>Search</button>
        </form>
    )
}
