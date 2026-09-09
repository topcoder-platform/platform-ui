/* Form callbacks capture the current lookup selection. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, useEffect, useState } from 'react'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'
import { fetchSkillAutocompleteOptions } from '~/libs/shared/lib/services/standard-skills'

import { contactError } from '../contact.service'

interface Option {
    label: string
    value: string
}
interface Props {
    kind: 'skill' | 'group'
    values?: string[]
    onChange: (values: string[]) => void
}

/**
 * Searches the authoritative skill or group API by name and adds stable IDs to an audience filter.
 * @param props lookup kind, currently selected IDs, and the immutable selection callback.
 * @returns a debounced name search with selectable matching names and IDs.
 * @throws Lookup errors are displayed inline; stale results are discarded when the query changes.
 */
export const MemberFilterLookup: FC<Props> = props => {
    const [query, setQuery] = useState('')
    const [options, setOptions] = useState<Option[]>([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let mounted = true
        setOptions([])
        setError('')
        if (query.trim().length < 2) {
            setLoading(false)
            return undefined
        }

        setLoading(true)
        const timer = window.setTimeout(() => {
            const request
                = props.kind === 'skill'
                    ? fetchSkillAutocompleteOptions(query.trim())
                    : xhrGetAsync<Array<{ id: string; name: string }>>(
                        `${EnvironmentConfig.API.V6}/groups?perPage=25&page=1&name=${encodeURIComponent(
                            query.trim(),
                        )}`,
                    )
                        .then(groups => groups.map(group => ({ label: group.name, value: group.id })))
            request
                .then(results => {
                    if (mounted) setOptions(results)
                })
                .catch(failure => {
                    if (mounted) setError(contactError(failure))
                })
                .finally(() => {
                    if (mounted) setLoading(false)
                })
        }, 350)
        return () => {
            mounted = false
            window.clearTimeout(timer)
        }
    }, [props.kind, query])

    return (
        <div>
            <label>
                Find a
                {' '}
                {props.kind}
                {' '}
                by name
                <input
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder='Type at least two characters'
                />
            </label>
            {loading && <p role='status'>Searching…</p>}
            {error && (
                <p className='contact-error' role='alert'>
                    {error}
                </p>
            )}
            {!loading && query.trim().length >= 2 && !options.length && !error && (
                <p className='contact-help'>
                    No matching
                    {props.kind}
                    s.
                </p>
            )}
            <div className='contact-actions'>
                {options.map(option => (
                    <button
                        type='button'
                        key={option.value}
                        disabled={props.values?.includes(option.value)}
                        onClick={() => props.onChange([...new Set([...(props.values || []), option.value])])}
                    >
                        {option.label}
                        {props.values?.includes(option.value) ? ' ✓' : ' +'}
                    </button>
                ))}
            </div>
        </div>
    )
}
