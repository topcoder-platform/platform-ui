/* Form callbacks capture the current field and draft state. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'

import { AutomationManager } from './components/AutomationManager'
import { CampaignComposer } from './components/CampaignComposer'
import { CampaignResults } from './components/CampaignResults'
import { SegmentManager } from './components/SegmentManager'
import { SubscriptionManager } from './components/SubscriptionManager'
import { Campaign, ContactConfig, EmailTemplate, Segment } from './contact.models'
import { contactError, contactGet, contactPost } from './contact.service'
import './contact.scss'

type Tab = 'campaigns' | 'segments' | 'subscriptions' | 'automations'
const CONTACT_TABS: Tab[] = ['campaigns', 'segments', 'subscriptions', 'automations']

/**
 * Renders the administrator-only Contact application with live API campaigns, segments, and subscriptions.
 * @returns the Contact workspace; the platform route and API independently require administrator access.
 * @throws API failures are displayed with retry controls. React/editor render errors use the platform boundary.
 */
const ContactApp: FC = () => {
    const [tab, setTab] = useState<Tab>('campaigns')
    const [config, setConfig] = useState<ContactConfig>()
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [segments, setSegments] = useState<Segment[]>([])
    const segmentGeneration = useRef(0)
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [editing, setEditing] = useState<Campaign | 'new'>()
    const [report, setReport] = useState<Campaign>()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState<Campaign>()
    const [busy, setBusy] = useState(false)

    /**
     * Loads Contact resources together and ignores segment results superseded by a reload or confirmed mutation.
     * @returns resolves after workspace resources update; newer authoritative segment state is preserved.
     * @throws Rejects on API, network, or authorization failures.
     */
    const reload = useCallback(async (): Promise<void> => {
        segmentGeneration.current += 1
        const generation = segmentGeneration.current
        const [nextConfig, nextCampaigns, nextSegments, nextTemplates] = await Promise.all([
            contactGet<ContactConfig>('config'),
            contactGet<Campaign[]>('campaigns'),
            contactGet<Segment[]>('segments'),
            contactGet<EmailTemplate[]>('templates'),
        ])
        setConfig(nextConfig)
        setCampaigns(nextCampaigns)
        if (generation === segmentGeneration.current) setSegments(nextSegments)
        setTemplates(nextTemplates)
    }, [])

    /**
     * Updates parent inventory from the saved API response and invalidates older segment list requests.
     * @param segment authoritative POST/PATCH response, retained across tab switches and refresh failures.
     * @returns void after replacing the existing segment or prepending the newly created definition.
     * @throws Does not throw.
     */
    function segmentSaved(segment: Segment): void {
        segmentGeneration.current += 1
        setSegments(previous => (previous.some(item => item.id === segment.id)
            ? previous.map(item => (item.id === segment.id ? segment : item))
            : [segment, ...previous]))
    }

    /**
     * Removes a confirmed deletion from parent inventory and invalidates older segment list requests.
     * @param id exact deleted segment ID; all other definitions are preserved.
     * @returns void after removing the definition, including when the Segments tab subsequently unmounts.
     * @throws Does not throw.
     */
    function segmentDeleted(id: string): void {
        segmentGeneration.current += 1
        setSegments(previous => previous.filter(item => item.id !== id))
    }

    useEffect(() => {
        reload()
            .catch(failure => setError(contactError(failure)))
            .finally(() => setLoading(false))
    }, [reload])

    /**
     * Runs a campaign mutation and reloads server state, preserving the selected view on failure.
     * @param action mutation to perform before reloading workspace state.
     * @returns resolves once the action finishes and busy state is reset.
     * @throws Does not throw; failures appear in the application alert.
     */
    async function run(action: () => Promise<void>): Promise<void> {
        setBusy(true)
        setError('')
        try {
            await action()
            await reload()
        } catch (failure) {
            setError(contactError(failure))
        } finally {
            setBusy(false)
        }
    }

    /**
     * Replaces or prepends a persisted campaign after composer saves without unmounting the editor.
     * @param campaign authoritative saved API response.
     * @returns void after updating the campaign inventory.
     * @throws Does not throw.
     */
    function saved(campaign: Campaign): void {
        setCampaigns(previous => [
            campaign,
            ...previous.filter(item => item.id !== campaign.id),
        ])
    }

    /**
     * Duplicates the selected campaign into a new draft and opens its editor.
     * @param campaign source email whose content and audience criteria will be copied.
     * @returns resolves after the draft editor opens.
     * @throws Rejects when the duplication API fails.
     */
    async function duplicate(campaign: Campaign): Promise<void> {
        const copy = await contactPost<Campaign>(`campaigns/${campaign.id}/duplicate`, {})
        setEditing(copy)
    }

    /**
     * Cancels the reviewed scheduled/sending campaign; already handed-off SES messages remain deliverable.
     * @returns resolves after cancelling the selected campaign, or immediately when none is selected.
     * @throws Rejects on API failure; the action runner displays the error.
     */
    async function cancelCampaign(): Promise<void> {
        if (!cancelling) return
        await contactPost(`campaigns/${cancelling.id}/cancel`, {})
        setCancelling(undefined)
    }

    /**
     * Selects and focuses the adjacent tab for arrow keys, or the first/last tab for Home/End.
     * @param event keyboard event from the Contact tab currently holding focus.
     * @returns void after updating tab selection and focus; unrelated keys retain browser behavior.
     * @throws Does not throw; a missing tab element simply skips the focus update.
     */
    function navigateTabs(event: KeyboardEvent<HTMLButtonElement>): void {
        const current = CONTACT_TABS.indexOf(tab)
        const indices: Partial<Record<string, number>> = {
            ArrowLeft: (current + CONTACT_TABS.length - 1) % CONTACT_TABS.length,
            ArrowRight: (current + 1) % CONTACT_TABS.length,
            End: CONTACT_TABS.length - 1,
            Home: 0,
        }
        const nextIndex = indices[event.key]
        if (nextIndex === undefined) return
        event.preventDefault()
        const next = CONTACT_TABS[nextIndex]
        setTab(next)
        event.currentTarget.parentElement
            ?.querySelector<HTMLButtonElement>(`#contact-tab-${next}`)
            ?.focus()
    }

    return (
        <main className='contact-app'>
            <header className='contact-header'>
                <div>
                    <span className='contact-eyebrow'>TOPCODER · ADMIN</span>
                    <h1>Contact</h1>
                    <p>Thoughtful emails for the Topcoder community.</p>
                </div>
                <span className='contact-service'>Delivered with Amazon SES</span>
            </header>
            {!editing && !report && (
                <div role='tablist' aria-label='Contact sections' className='contact-tabs'>
                    {CONTACT_TABS.map(
                        value => (
                            <button
                                type='button'
                                key={value}
                                role='tab'
                                id={`contact-tab-${value}`}
                                aria-selected={tab === value}
                                aria-controls={tab === value ? `contact-panel-${value}` : undefined}
                                tabIndex={tab === value ? 0 : -1}
                                onClick={() => setTab(value)}
                                onKeyDown={navigateTabs}
                            >
                                {value.charAt(0)
                                    .toUpperCase() + value.slice(1)}
                            </button>
                        ),
                    )}
                </div>
            )}
            {error && (
                <div role='alert' className='contact-error'>
                    {error}
                    <button type='button' onClick={() => run(async () => undefined)}>
                        Retry
                    </button>
                </div>
            )}
            {config?.warnings?.map(warning => <p className='contact-warning' key={warning}>{warning}</p>)}
            {loading && <p role='status'>Loading Contact workspace…</p>}
            {config && editing && (
                <CampaignComposer
                    key={editing === 'new' ? 'new' : editing.id}
                    campaign={editing === 'new' ? undefined : editing}
                    config={config}
                    segments={segments}
                    templates={templates}
                    onTemplateSaved={template => setTemplates(previous => [template, ...previous])}
                    onSaved={saved}
                    onClose={() => setEditing(undefined)}
                />
            )}
            {report && <CampaignResults campaign={report} onClose={() => setReport(undefined)} />}
            {config && !editing && !report && (
                <div
                    role='tabpanel'
                    id={`contact-panel-${tab}`}
                    aria-labelledby={`contact-tab-${tab}`}
                    className='contact-tab-panel'
                >
                    {tab === 'campaigns' && (
                        <section>
                            <div className='contact-toolbar'>
                                <h2>Email campaigns</h2>
                                <button
                                    type='button'
                                    disabled={busy}
                                    onClick={() => run(async () => undefined)}
                                >
                                    Refresh
                                </button>
                                <button
                                    type='button'
                                    className='contact-primary'
                                    onClick={() => setEditing('new')}
                                >
                                    Create email
                                </button>
                            </div>
                            {!config.sendingEnabled && (
                                <p className='contact-warning'>
                                    Sending is disabled in this environment. You can prepare content
                                    and audiences.
                                </p>
                            )}
                            {!campaigns.length && (
                                <div className='contact-empty'>
                                    <h3>Your next campaign starts here</h3>
                                    <p>
                                        Create an email, select subscribed members, preview it, and
                                        review the cost before scheduling.
                                    </p>
                                </div>
                            )}
                            {campaigns.length > 0 && (
                                <div className='contact-table-scroll'>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Campaign</th>
                                                <th>Status</th>
                                                <th>Recipients</th>
                                                <th>Updated / scheduled</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {campaigns.map(campaign => (
                                                <tr key={campaign.id}>
                                                    <td>
                                                        <strong>{campaign.name}</strong>
                                                        <br />
                                                        <small>{campaign.subject}</small>
                                                    </td>
                                                    <td>
                                                        <span className='contact-badge'>
                                                            {campaign.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {campaign.recipientCount?.toLocaleString()
                                                            ?? 'Not calculated'}
                                                    </td>
                                                    <td>
                                                        {new Date(
                                                            campaign.scheduledAt
                                                                || campaign.updatedAt,
                                                        )
                                                            .toLocaleString()}
                                                    </td>
                                                    <td>
                                                        <div className='contact-actions'>
                                                            {campaign.status.toLowerCase()
                                                                === 'draft' && (
                                                                <button
                                                                    type='button'
                                                                    disabled={busy}
                                                                    onClick={() => setEditing(campaign)}
                                                                >
                                                                    Edit
                                                                </button>
                                                            )}
                                                            <button
                                                                type='button'
                                                                disabled={busy}
                                                                onClick={() => setReport(campaign)}
                                                            >
                                                                Results
                                                            </button>
                                                            <button
                                                                type='button'
                                                                disabled={busy}
                                                                onClick={() => run(() => duplicate(campaign))}
                                                            >
                                                                Duplicate
                                                            </button>
                                                            {[
                                                                'scheduled',
                                                                'sending',
                                                                'queued',
                                                            ].includes(
                                                                campaign.status.toLowerCase(),
                                                            ) && (
                                                                <button
                                                                    type='button'
                                                                    disabled={busy}
                                                                    onClick={() => setCancelling(campaign)}
                                                                >
                                                                    Cancel send
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {cancelling && (
                                <div className='contact-confirmation'>
                                    <h3>
                                        Cancel
                                        {cancelling.name}
                                        ?
                                    </h3>
                                    <p>
                                        Remaining recipients will be stopped. Messages already
                                        handed to SES cannot be recalled.
                                    </p>
                                    <div className='contact-toolbar'>
                                        <button
                                            type='button'
                                            disabled={busy}
                                            onClick={() => setCancelling(undefined)}
                                        >
                                            Keep sending
                                        </button>
                                        <button
                                            type='button'
                                            disabled={busy}
                                            onClick={() => run(cancelCampaign)}
                                        >
                                            Confirm cancellation
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                    {tab === 'automations' && (
                        <AutomationManager campaigns={campaigns} config={config} />
                    )}
                    {tab === 'segments' && (
                        <SegmentManager
                            segments={segments}
                            onSaved={segmentSaved}
                            onDeleted={segmentDeleted}
                            onRefresh={reload}
                        />
                    )}
                    {tab === 'subscriptions' && (
                        <SubscriptionManager types={config.subscriptionTypes} onRefresh={reload} />
                    )}
                </div>
            )}
        </main>
    )
}

export default ContactApp
