/* Form callbacks capture the current field and draft state. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, useState } from 'react'

import { Segment, SegmentFilter } from '../contact.models'
import { contactError, contactPost } from '../contact.service'

import { SegmentFields } from './SegmentFields'

interface Props {
    segments: Segment[]
    onRefresh: () => Promise<void>
}

/**
 * Creates reusable member filters and lets administrators inspect or copy existing filters.
 * @param props current saved segments and callback to reload them after creation.
 * @returns the segment library and criteria form; segments reference members without duplicating contacts.
 * @throws API failures are displayed inline and preserve the input filter.
 */
export const SegmentManager: FC<Props> = props => {
    const [name, setName] = useState('')
    const [filter, setFilter] = useState<SegmentFilter>({})
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    /**
     * Saves the named reusable filter and refreshes the segment library; catches API validation failures.
     * @returns resolves after saving or displaying an error, preserving unsaved values on failure.
     * @throws Does not throw; validation and API failures appear in an alert.
     */
    async function save(): Promise<void> {
        setBusy(true)
        setError('')
        try {
            if (!name.trim()) throw new Error('Enter a segment name.')
            await contactPost('segments', { filter, name })
            await props.onRefresh()
            setName('')
            setFilter({})
        } catch (failure) {
            setError(contactError(failure))
        } finally {
            setBusy(false)
        }
    }

    return (
        <section>
            <h2>Member segments</h2>
            <p>
                Save reusable filters against the current member database. Exact eligible counts are
                calculated for a saved email and subscription type before sending.
            </p>
            {error && (
                <p role='alert' className='contact-error'>
                    {error}
                </p>
            )}
            <div className='contact-grid'>
                {props.segments.map(segment => (
                    <article className='contact-card' key={segment.id}>
                        <h3>{segment.name}</h3>
                        <pre>{JSON.stringify(segment.filter, undefined, 2)}</pre>
                        <button
                            type='button'
                            onClick={() => {
                                setName(`${segment.name} copy`)
                                setFilter(segment.filter)
                            }}
                        >
                            Use these criteria
                        </button>
                    </article>
                ))}
            </div>
            {!props.segments.length && <p>No saved segments yet.</p>}
            <fieldset disabled={busy} className='contact-fields'>
                <legend>New segment</legend>
                <label>
                    Segment name
                    <input value={name} onChange={event => setName(event.target.value)} />
                </label>
                <SegmentFields value={filter} onChange={setFilter} />
                <button type='button' className='contact-primary' onClick={save}>
                    Save segment
                </button>
            </fieldset>
        </section>
    )
}
