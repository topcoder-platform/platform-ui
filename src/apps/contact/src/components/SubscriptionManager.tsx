/* Form callbacks capture the current field and draft state. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, useEffect, useRef, useState } from 'react'

import { MemberIdentity, MemberSubscriptions, SubscriptionType } from '../contact.models'
import { contactError, contactGet, contactLookupMember, contactPatch, contactPost } from '../contact.service'

interface Props {
    types: SubscriptionType[]
    onRefresh: () => Promise<void>
}

/**
 * Manages subscription categories and explicit preferences for existing Topcoder members.
 * @param props current categories and a refresh callback after changes.
 * @returns category controls plus individual and audited bulk current preference update forms.
 * @throws API and JSON validation failures are caught and displayed without silently skipping rows.
 */
export const SubscriptionManager: FC<Props> = props => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [memberQuery, setMemberQuery] = useState('')
    const [identity, setIdentity] = useState<MemberIdentity>()
    const [member, setMember] = useState<MemberSubscriptions>()
    const [memberLoading, setMemberLoading] = useState(false)
    const memberGeneration = useRef(0)
    const [source, setSource] = useState('')
    const sourceRef = useRef<HTMLInputElement>(null)
    const [memberError, setMemberError] = useState('')
    const [memberMessage, setMemberMessage] = useState('')
    const [savingPreference, setSavingPreference] = useState<string>()
    const [bulk, setBulk] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [bulkConfirmed, setBulkConfirmed] = useState(false)

    useEffect(() => () => { memberGeneration.current += 1 }, [])

    /**
     * Invalidates lookup results when the administrator edits the handle/email input.
     * @param value current lookup text; never interpreted as an internal member ID.
     * @returns void after clearing the prior identity, preferences and obsolete lookup messages.
     * @throws Does not throw; requests already in flight are ignored through the generation guard.
     */
    function changeMemberQuery(value: string): void {
        memberGeneration.current += 1
        setMemberQuery(value)
        setIdentity(undefined)
        setMember(undefined)
        setMemberLoading(false)
        setError('')
        setMessage('')
        setMemberError('')
        setMemberMessage('')
    }

    /**
     * Runs an administrative preference action and presents any request/validation failure.
     * @param action category or preference operation to perform.
     * @param memberAction whether failures belong beside the member preference controls.
     * @returns resolves after busy state resets.
     * @throws Does not throw; errors are displayed inline.
     */
    async function run(action: () => Promise<void>, memberAction: boolean = false): Promise<void> {
        setBusy(true)
        setError('')
        setMessage('')
        if (memberAction) {
            setMemberError('')
            setMemberMessage('')
        }

        try {
            await action()
        } catch (failure) {
            if (memberAction) setMemberError(contactError(failure))
            else setError(contactError(failure))
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
     * Resolves a handle/email and fetches that canonical member's current preferences and suppression status.
     * @returns completion after the current query resolves or displays its error; obsolete responses are ignored.
     * @throws Does not throw; errors clear prior member actions until a fresh lookup succeeds.
     */
    async function loadMember(): Promise<void> {
        memberGeneration.current += 1
        const generation = memberGeneration.current
        setIdentity(undefined)
        setMember(undefined)
        setError('')
        setMessage('')
        setMemberError('')
        setMemberMessage('')
        setMemberLoading(true)
        try {
            const resolved = await contactLookupMember(memberQuery)
            if (generation !== memberGeneration.current) return
            const preferences = await contactGet<MemberSubscriptions>(
                `subscriptions?memberId=${encodeURIComponent(resolved.memberId)}`,
            )
            if (generation !== memberGeneration.current) return
            setIdentity(resolved)
            setMember(preferences)
        } catch (failure) {
            if (generation === memberGeneration.current) setMemberError(contactError(failure))
        } finally {
            if (generation === memberGeneration.current) setMemberLoading(false)
        }
    }

    /**
     * Validates explicit preference evidence beside the action before starting a save.
     * @param subscriptionTypeId category selected by the administrator.
     * @param subscribed affirmative opt-in or opt-out requested by the clicked action.
     * @returns completion after validation feedback or the authenticated save and refresh.
     * @throws Does not throw; missing evidence focuses its field and request failures remain beside the action.
     */
    async function recordPreference(subscriptionTypeId: string, subscribed: boolean): Promise<void> {
        if (busy) return
        if (!source.trim()) {
            setMemberError('Enter the member request or consent evidence below before recording this preference.')
            setMemberMessage('')
            sourceRef.current?.focus()
            return
        }

        setSavingPreference(subscriptionTypeId)
        await run(() => updatePreference(subscriptionTypeId, subscribed), true)
        setSavingPreference(undefined)
    }

    /**
     * Records an explicit preference and refreshes by the already resolved canonical ID, without a new lookup.
     * @param subscriptionTypeId existing subscription category identifier.
     * @param subscribed explicit member opt-in or opt-out value.
     * @returns resolves after saving and reloading the selected member preferences.
     * @throws Error on missing provenance or failed API writes/reads.
     */
    async function updatePreference(subscriptionTypeId: string, subscribed: boolean): Promise<void> {
        if (!member || !identity) throw new Error('Look up the member preferences before saving.')
        if (!source.trim()) throw new Error('Describe the consent or preference source before saving.')
        const resolved = identity
        const generation = memberGeneration.current
        await contactPost('subscriptions', {
            memberId: resolved.memberId,
            source: source.trim(),
            subscribed,
            subscriptionTypeId,
        })
        if (generation !== memberGeneration.current) return
        setMember(undefined)
        try {
            const preferences = await contactGet<MemberSubscriptions>(
                `subscriptions?memberId=${encodeURIComponent(resolved.memberId)}`,
            )
            if (generation !== memberGeneration.current) return
            setMember(preferences)
            setMemberMessage(`Preference saved for ${resolved.handle}.`)
        } catch (failure) {
            if (generation !== memberGeneration.current) return
            setIdentity(undefined)
            throw new Error(`Preference saved for ${resolved.handle}, but refresh failed. `
                + `Look up preferences again. ${contactError(failure)}`)
        }
    }

    /**
     * Resolves every handle/email before applying up to 500 explicit current preferences with audit provenance.
     * Replaces each listed member/category choice; historical timestamps require the reviewed migration process.
     * @returns after all rows save; reports the completed count if an API failure stops the updates.
     * @throws Validation, lookup or duplicate-member/category failures before any writes; annotated write errors.
     */
    async function updateCurrentPreferences(): Promise<void> {
        if (!source.trim() || !bulkConfirmed) {
            throw new Error('Provide a source and confirm these preference updates take effect now.')
        }

        const rows: unknown = JSON.parse(bulk)
        if (!Array.isArray(rows) || !rows.length || rows.length > 500) {
            throw new Error('Provide a JSON array containing 1–500 current preference updates.')
        }

        for (const row of rows) {
            if (
                !row
                || typeof row.member !== 'string'
                || !row.member.trim()
                || row.memberId !== undefined
                || typeof row.subscriptionTypeId !== 'string'
                || !props.types.some(type => type.id === row.subscriptionTypeId)
                || typeof row.subscribed !== 'boolean'
            ) {
                throw new Error(
                    'Each row needs member (handle or email), known subscriptionTypeId, and boolean subscribed. '
                    + 'Member IDs are not accepted.',
                )
            }
        }

        const resolvedRows: Array<{ memberId: string; subscriptionTypeId: string; subscribed: boolean }> = []
        const resolvedQueries = new Map<string, MemberIdentity>()
        const choices = new Set<string>()
        for (const [index, row] of rows.entries()) {
            try {
                const query = row.member.trim()
                const key = query.toLowerCase()
                // Resolve bounded rows sequentially; no preference writes occur until all identities are known.
                // eslint-disable-next-line no-await-in-loop
                const resolved = resolvedQueries.get(key) || await contactLookupMember(query)
                resolvedQueries.set(key, resolved)
                const choice = JSON.stringify([resolved.memberId, row.subscriptionTypeId])
                if (choices.has(choice)) {
                    throw new Error(`Duplicate preference for ${resolved.handle} and this subscription category.`)
                }

                choices.add(choice)
                resolvedRows.push({
                    memberId: resolved.memberId,
                    subscribed: row.subscribed,
                    subscriptionTypeId: row.subscriptionTypeId,
                })
            } catch (failure) {
                throw new Error(`No preferences were updated. Row ${index + 1}: ${contactError(failure)}`)
            }
        }

        memberGeneration.current += 1
        setIdentity(undefined)
        setMember(undefined)
        setMemberLoading(false)
        setMemberError('')
        setMemberMessage('')
        let completed = 0
        for (const row of resolvedRows) {
            try {
                // Sequential writes make partial failure position and retry behavior explicit.
                // eslint-disable-next-line no-await-in-loop
                await contactPost('subscriptions', {
                    memberId: row.memberId,
                    source: source.trim(),
                    subscribed: row.subscribed,
                    subscriptionTypeId: row.subscriptionTypeId,
                })
                completed += 1
                setMessage(`Updated ${completed} of ${rows.length} current preferences, effective now.`)
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
                <div className='contact-table-scroll'>
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
                </div>
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
                {memberError && (
                    <p id='contact-member-preference-error' role='alert' className='contact-error'>
                        {memberError}
                    </p>
                )}
                {memberMessage && <p role='status' className='contact-success'>{memberMessage}</p>}
                <div className='contact-toolbar contact-control-row'>
                    <label>
                        Topcoder handle or email
                        <input
                            value={memberQuery}
                            onChange={event => changeMemberQuery(event.target.value)}
                            placeholder='member.handle or member@example.com'
                        />
                    </label>
                    <button type='button' disabled={memberLoading || !memberQuery.trim()} onClick={loadMember}>
                        Look up preferences
                    </button>
                </div>
                {memberLoading && <p role='status'>Loading member preferences…</p>}
                <label>
                    Preference source / consent evidence
                    <input
                        ref={sourceRef}
                        value={source}
                        maxLength={500}
                        aria-invalid={!!memberError && !source.trim()}
                        aria-describedby={memberError ? 'contact-member-preference-error' : undefined}
                        onChange={event => {
                            setSource(event.target.value)
                            setMemberError('')
                        }}
                        placeholder='Member request ticket ID / current consent evidence'
                    />
                </label>
                <p className='contact-help'>
                    Required before recording a preference. Enter the member request or consent record;
                    only record an opt-in when the member explicitly agreed.
                </p>
                {savingPreference && <p role='status'>Saving member preference…</p>}
                {member && identity && (
                    <>
                        <h3>
                            {identity.handle}
                        </h3>
                        <p>{identity.email}</p>
                        {member.suppressed && (
                            <p className='contact-warning'>
                                This member is suppressed. Category changes do not remove delivery
                                suppression.
                            </p>
                        )}
                        <div className='contact-table-scroll'>
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
                                                        aria-describedby={memberError
                                                            ? 'contact-member-preference-error' : undefined}
                                                        onClick={() => {
                                                            recordPreference(type.id, !preference?.subscribed)
                                                        }}
                                                    >
                                                        {savingPreference === type.id
                                                            ? 'Saving preference…'
                                                            : preference?.subscribed
                                                                ? 'Record opt-out'
                                                                : 'Record explicit opt-in'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </fieldset>
            <fieldset className='contact-fields' disabled={busy}>
                <legend>Bulk update current preferences</legend>
                <p>
                    Updates take effect now and replace each listed member&apos;s current choice for that
                    category. Set the preference source above. Maximum 500 updates per batch.
                    Identify each member by handle or email. Every member is resolved before any updates are saved.
                </p>
                <p>
                    For historical HubSpot records, use the reviewed migration process to preserve original
                    timestamps and opt-outs. This form does not preserve historical timestamps.
                </p>
                <label>
                    Current preference updates (JSON)
                    <textarea
                        rows={8}
                        value={bulk}
                        onChange={event => {
                            setBulk(event.target.value)
                            setBulkConfirmed(false)
                        }}
                        placeholder={'[{"member":"member.handle","subscriptionTypeId":"category-id",'
                            + '"subscribed":true}]'}
                    />
                </label>
                <label className='contact-check'>
                    <input
                        type='checkbox'
                        checked={bulkConfirmed}
                        onChange={event => setBulkConfirmed(event.target.checked)}
                    />
                    I confirm these are authorized current preference updates, effective now,
                    replacing the listed current choices.
                </label>
                <button type='button' disabled={!bulkConfirmed} onClick={() => run(updateCurrentPreferences)}>
                    Apply current preferences now
                </button>
            </fieldset>
        </section>
    )
}
