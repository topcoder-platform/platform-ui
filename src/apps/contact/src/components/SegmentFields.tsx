/* Form callbacks capture the current field and draft state. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, useEffect, useState } from 'react'

import { SegmentFilter } from '../contact.models'
import { fromSegmentDateInput, toSegmentDateInput } from '../segment-date'

import { MemberFilterLookup } from './MemberFilterLookup'

interface Props {
    value: SegmentFilter
    onChange: (value: SegmentFilter) => void
    disabled?: boolean
}

/**
 * Splits comma-separated filter values, trims whitespace, and removes duplicates/empty values.
 * @param value text entered into a segment field.
 * @returns the unique values, or undefined when no restriction is requested.
 * @throws Does not throw.
 */
function listValue(value: string): string[] | undefined {
    const values = [
        ...new Set(
            value
                .split(',')
                .map(item => item.trim())
                .filter(Boolean),
        ),
    ]
    return values.length ? values : undefined
}

interface ListInputProps {
    values?: string[]
    placeholder: string
    onChange: (values: string[] | undefined) => void
}

/**
 * Preserves partially entered comma-separated values while updating normalized segment criteria.
 * @param props selected values, an example placeholder, and normalized-value callback.
 * @returns an input that retains trailing separators and responds to external segment selection.
 * @throws Does not throw.
 */
const FilterListInput: FC<ListInputProps> = props => {
    const serialized = props.values?.join(', ') || ''
    const [text, setText] = useState(serialized)
    useEffect(() => setText(serialized), [serialized])
    return (
        <input
            value={text}
            placeholder={props.placeholder}
            onChange={event => {
                setText(event.target.value)
                props.onChange(listValue(event.target.value))
            }}
        />
    )
}

/**
 * Renders all supported member criteria for saved segments and campaign audience selection.
 * @param props current filter, immutable update callback, and optional read-only state.
 * @returns accessible criteria fields; the API validates IDs, dates, and numeric ranges.
 * @throws Does not throw.
 */
export const SegmentFields: FC<Props> = props => (
    <fieldset disabled={props.disabled} className='contact-fields'>
        <legend>Member criteria</legend>
        <p className='contact-help'>
            All criteria are combined. All selected skills must match;
            country, group, and language values match any selection.
        </p>
        <div className='contact-grid'>
            <MemberFilterLookup
                kind='skill'
                values={props.value.skillIds}
                onChange={skillIds => props.onChange({ ...props.value, skillIds })}
            />
            <MemberFilterLookup
                kind='group'
                values={props.value.groupIds}
                onChange={groupIds => props.onChange({ ...props.value, groupIds })}
            />
            {(
                [
                    ['countries', 'Countries (ISO codes)', 'US, IN, AU'],
                    ['skillIds', 'Skill IDs', 'Standardized skill IDs, comma separated'],
                    ['groupIds', 'Group IDs', 'Group IDs, comma separated'],
                    ['languages', 'Languages', 'English, Spanish'],
                ] as const
            ).map(([key, label, placeholder]) => (
                <label key={key}>
                    {label}
                    <FilterListInput
                        values={props.value[key]}
                        placeholder={placeholder}
                        onChange={values => props.onChange({ ...props.value, [key]: values })}
                    />
                </label>
            ))}
            {(
                [
                    ['joinedFrom', 'Joined on or after'],
                    ['joinedTo', 'Joined on or before'],
                    ['activeFrom', 'Active on or after'],
                    ['activeTo', 'Active on or before'],
                ] as const
            ).map(([key, label]) => (
                <label key={key}>
                    {label}
                    <input
                        type='date'
                        value={toSegmentDateInput(props.value[key], key.endsWith('To'))}
                        onChange={event => props.onChange({
                            ...props.value,
                            [key]: fromSegmentDateInput(event.target.value, key.endsWith('To')),
                        })}
                    />
                </label>
            ))}
            <label>
                Gigs availability
                <select
                    value={
                        props.value.availableForGigs === undefined ? '' : String(props.value.availableForGigs)
                    }
                    onChange={event => props.onChange({
                        ...props.value,
                        availableForGigs:
                                event.target.value === '' ? undefined : event.target.value === 'true',
                    })}
                >
                    <option value=''>Any availability</option>
                    <option value='true'>Available for gigs</option>
                    <option value='false'>Not available for gigs</option>
                </select>
            </label>
            {(['min', 'max'] as const).map(key => (
                <label key={key}>
                    {key === 'min' ? 'Minimum rating' : 'Maximum rating'}
                    <input
                        type='number'
                        min='0'
                        value={props.value.rating?.[key] ?? ''}
                        onChange={event => props.onChange({
                            ...props.value,
                            rating: {
                                ...props.value.rating,
                                [key]: event.target.value === '' ? undefined : Number(event.target.value),
                            },
                        })}
                    />
                </label>
            ))}
            {(['trackId', 'typeId'] as const).map(key => (
                <label key={key}>
                    {key === 'trackId' ? 'Rating track ID (optional)' : 'Rating type ID (optional)'}
                    <input
                        value={props.value.rating?.[key] || ''}
                        onChange={event => props.onChange({
                            ...props.value,
                            rating: { ...props.value.rating, [key]: event.target.value || undefined },
                        })}
                    />
                </label>
            ))}
        </div>
    </fieldset>
)
