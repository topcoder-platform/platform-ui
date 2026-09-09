/* Form callbacks capture the current field and draft state. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, useState } from 'react'

import { MemberSubscriptions, SubscriptionType } from '../contact.models'
import { contactError, contactGet, contactPatch, contactPost } from '../contact.service'

interface Props {
    types: SubscriptionType[]
    onRefresh: () => Promise<void>
}

/**
 * Manages subscription categories and explicit preferences for existing Topcoder members.
 * @param props current categories and a refresh callback after changes.
 * @returns category controls plus individual and audited bulk preference migration forms.
 * @throws API and JSON validation failures are caught and displayed without silently skipping rows.
 */
export const SubscriptionManager: FC<Props> = props => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [memberId, setMemberId] = useState('')
    const [member, setMember] = useState<MemberSubscriptions>()
    const [source, setSource] = useState('')
    const [bulk, setBulk] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [bulkConfirmed, setBulkConfirmed] = useState(false)

    /**
     * Runs an administrative preference action and presents any request/validation failure.
     * @param action category or preference operation to perform.
     * @returns resolves after busy state resets.
     * @throws Does not throw; errors are displayed inline.
     */
    async function run(action: () => Promise<void>): Promise<void> {
        setBusy(true)
        setError('')
        setMessage('')
        try {
            await action()
        } catch (failure) {
            setError(contactError(failure))
        } finally {
            setBusy(false)
        }
    }

    /**
     * Adds an explicitly named subscription category; returns after the parent reloads current categories.
     * @returns resolves after the new category appears and creation inputs reset.
     * @throws Error for a missing name or a failed API request.
     */
    async function createType(): Promise<void> {
        if (!name.trim()) throw new Error('Enter a category name.')
        await contactPost('subscription-types', { description, name })
        setName('')
        setDescription('')
        await props.onRefresh()
        setMessage('Subscription type created.')
    }

    /**
     * Fetches current category preferences and suppression status for the specified existing member.
     * @returns resolves after the member preference document replaces the previous lookup.
     * @throws Error for an empty member ID or failed lookup request.
     */
    async function loadMember(): Promise<void> {
        if (!memberId.trim()) throw new Error('Enter an existing Topcoder member ID.')
        setMember(
            await contactGet<MemberSubscriptions>(
                `subscriptions?memberId=${encodeURIComponent(memberId.trim())}`,
            ),
        )
    }

    /**
     * Records a member preference with provenance and reloads authoritative subscription state.
     * @param subscriptionTypeId existing subscription category identifier.
     * @param subscribed explicit member opt-in or opt-out value.
     * @returns resolves after saving and reloading the selected member preferences.
     * @throws Error on missing provenance or failed API writes/reads.
     */
    async function updatePreference(subscriptionTypeId: string, subscribed: boolean): Promise<void> {
        if (!source.trim()) throw new Error('Describe the consent or preference source before saving.')
        if (!member) return
        await contactPost('subscriptions', {
            memberId: member.memberId,
            source,
            subscribed,
            subscriptionTypeId,
        })
        await loadMember()
        setMessage('Member preference saved.')
    }

    /**
     * Imports up to 500 explicit existing-member preferences sequentially with an audit source.
     * @returns after all rows save; reports the completed count if an API failure stops the import.
     * @throws Validation failures before writes, or an annotated API error at the first failed row.
     */
    async function importPreferences(): Promise<void> {
        if (!source.trim() || !bulkConfirmed) {
            throw new Error('Provide a source and confirm these are recorded preferences.')
        }

        const rows: unknown = JSON.parse(bulk)
        if (!Array.isArray(rows) || !rows.length || rows.length > 500) {
            throw new Error('Provide a JSON array containing 1–500 preference records.')
        }

        for (const row of rows) {
            if (
                !row
                || typeof row.memberId !== 'string'
                || !row.memberId.trim()
                || typeof row.subscriptionTypeId !== 'string'
                || !props.types.some(type => type.id === row.subscriptionTypeId)
                || typeof row.subscribed !== 'boolean'
            ) {
                throw new Error(
                    'Each row needs an existing memberId, known subscriptionTypeId, and boolean subscribed.',
                )
            }
        }

        let completed = 0
        for (const row of rows) {
            try {
                // Sequential writes make partial failure position and retry behavior explicit.
                // eslint-disable-next-line no-await-in-loop
                await contactPost('subscriptions', {
                    memberId: row.memberId,
                    source,
                    subscribed: row.subscribed,
                    subscriptionTypeId: row.subscriptionTypeId,
                })
                completed += 1
                setMessage(`Imported ${completed} of ${rows.length} preference records.`)
            } catch (failure) {
                throw new Error(
                    `Stopped after ${completed} saved rows. Row ${completed + 1}: ${contactError(
                        failure,
                    )}. Retry from this row; prior rows are already saved.`,
                )
            }
        }

        setBulk('')
        setBulkConfirmed(false)
    }

    return (
        <section>
            <h2>Subscriptions</h2>
            <p>
                Members remain in the member database. Categories store explicit email preferences for
                newsletters, marathon matches, customer updates, and other mailings.
            </p>
            {error && (
                <p role='alert' className='contact-error'>
                    {error}
                </p>
            )}
            {message && (
                <p role='status' className='contact-success'>
                    {message}
                </p>
            )}
            <fieldset className='contact-fields' disabled={busy}>
                <legend>Subscription categories</legend>
                <table>
                    <thead>
                        <tr>
                            <th>Name / ID</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.types.map(type => (
                            <tr key={type.id}>
                                <td>
                                    {type.name}
                                    <br />
                                    <small>{type.id}</small>
                                </td>
                                <td>{type.description}</td>
                                <td>{type.active ? 'Active' : 'Inactive'}</td>
                                <td>
                                    <button
                                        type='button'
                                        onClick={() => run(async () => {
                                            await contactPatch(`subscription-types/${type.id}`, {
                                                active: !type.active,
                                                description: type.description,
                                                name: type.name,
                                            })
                                            await props.onRefresh()
                                        })}
                                    >
                                        {type.active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className='contact-grid'>
                    <label>
                        New category name
                        <input
                            value={name}
                            onChange={event => setName(event.target.value)}
                            placeholder='Community Newsletter'
                        />
                    </label>
                    <label>
                        Description
                        <input value={description} onChange={event => setDescription(event.target.value)} />
                    </label>
                </div>
                <button type='button' onClick={() => run(createType)}>
                    Create subscription type
                </button>
            </fieldset>
            <fieldset className='contact-fields' disabled={busy}>
                <legend>Member preferences</legend>
                <div className='contact-toolbar'>
                    <label>
                        Existing member ID
                        <input
                            value={memberId}
                            onChange={event => {
                                setMemberId(event.target.value)
                                setMember(undefined)
                            }}
                        />
                    </label>
                    <button type='button' onClick={() => run(loadMember)}>
                        Look up preferences
                    </button>
                </div>
                <label>
                    Preference source / consent evidence
                    <input
                        value={source}
                        onChange={event => setSource(event.target.value)}
                        placeholder='HubSpot export 2026-09-09 / member request ticket ID'
                    />
                </label>
                {member && (
                    <>
                        <h3>
                            Member
                            {member.memberId}
                        </h3>
                        {member.suppressed && (
                            <p className='contact-warning'>
                                This member is suppressed. Category changes do not remove delivery
                                suppression.
                            </p>
                        )}
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Preference</th>
                                    <th>Source</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {props.types.map(type => {
                                    const preference = member.subscriptions.find(
                                        item => item.subscriptionTypeId === type.id,
                                    )
                                    return (
                                        <tr key={type.id}>
                                            <td>{type.name}</td>
                                            <td>
                                                {preference?.subscribed ? 'Subscribed' : 'Not subscribed'}
                                            </td>
                                            <td>{preference?.source || 'No recorded preference'}</td>
                                            <td>
                                                <button
                                                    type='button'
                                                    onClick={() => run(
                                                        () => updatePreference(type.id, !preference?.subscribed),
                                                    )}
                                                >
                                                    {preference?.subscribed
                                                        ? 'Record opt-out'
                                                        : 'Record explicit opt-in'}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </>
                )}
            </fieldset>
            <fieldset className='contact-fields' disabled={busy}>
                <legend>Import existing member preferences</legend>
                <p>
                    Use a verified export of existing subscription preferences. This imports preferences only;
                    it does not create contacts or infer consent. Set the source above. Maximum 500 records
                    per batch.
                </p>
                <label>
                    Preference records (JSON)
                    <textarea
                        rows={8}
                        value={bulk}
                        onChange={event => {
                            setBulk(event.target.value)
                            setBulkConfirmed(false)
                        }}
                        placeholder='[{"memberId":"123","subscriptionTypeId":"category-id","subscribed":true}]'
                    />
                </label>
                <label className='contact-check'>
                    <input
                        type='checkbox'
                        checked={bulkConfirmed}
                        onChange={event => setBulkConfirmed(event.target.checked)}
                    />
                    These records reflect existing explicit subscription preferences, including opt-outs.
                </label>
                <button type='button' disabled={!bulkConfirmed} onClick={() => run(importPreferences)}>
                    Import recorded preferences
                </button>
            </fieldset>
        </section>
    )
}
