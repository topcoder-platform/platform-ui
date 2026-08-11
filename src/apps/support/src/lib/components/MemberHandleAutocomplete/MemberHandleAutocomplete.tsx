/* eslint-disable react/jsx-no-bind */
/** Single-value member handle autocomplete for Support Team filters. */
import {
    FC,
    useMemo,
} from 'react'
import AsyncSelect from 'react-select/async'

import { autocompleteMemberHandles } from '../../services'

import styles from './MemberHandleAutocomplete.module.scss'

interface HandleOption {
    label: string
    value: string
}

export interface MemberHandleAutocompleteProps {
    onChange: (handle: string) => void
    value: string
}

/**
 * Creates a small debounced option loader for the member API.
 *
 * @returns a loader compatible with react-select AsyncSelect.
 * @throws Request failures are converted to an empty option list.
 */
function createOptionLoader(): (input: string) => Promise<HandleOption[]> {
    let timeoutId: number | undefined

    return (input: string): Promise<HandleOption[]> => new Promise(resolve => {
        if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId)
        }

        timeoutId = window.setTimeout(async () => {
            const term = input.trim()
            if (term.length < 3) {
                resolve([])
                return
            }

            try {
                const members = await autocompleteMemberHandles(term)
                resolve(members.map(member => ({
                    label: member.handle,
                    value: member.handle,
                })))
            } catch (error) {
                resolve([])
            }
        }, 300)
    })
}

/**
 * Renders a clearable, debounced, single-member handle picker.
 *
 * @param props current handle and change handler.
 * @returns member autocomplete control.
 * @throws Does not throw.
 */
export const MemberHandleAutocomplete: FC<MemberHandleAutocompleteProps> = props => {
    const loader = useMemo(createOptionLoader, [])
    const selected: HandleOption | undefined = props.value
        ? { label: props.value, value: props.value }
        : undefined

    return (
        <AsyncSelect
            aria-label='Member handle'
            cacheOptions
            className={styles.select}
            classNamePrefix='support-member-select'
            defaultOptions={false}
            isClearable
            loadOptions={loader}
            noOptionsMessage={({ inputValue }: { inputValue: string }) => (
                inputValue.trim().length < 3 ? 'Enter at least 3 characters' : 'No members found'
            )}
            onChange={option => props.onChange((option as HandleOption | undefined)?.value || '')}
            placeholder='Search member handle'
            value={selected}
        />
    )
}
