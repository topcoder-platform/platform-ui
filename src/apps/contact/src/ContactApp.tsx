/* Form callbacks capture the current field and draft state. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, useCallback, useEffect, useState } from 'react'

import { AutomationManager } from './components/AutomationManager'
import { CampaignComposer } from './components/CampaignComposer'
import { CampaignResults } from './components/CampaignResults'
import { SegmentManager } from './components/SegmentManager'
import { SubscriptionManager } from './components/SubscriptionManager'
import { Campaign, ContactConfig, EmailTemplate, Segment } from './contact.models'
import { contactError, contactGet, contactPost } from './contact.service'
import './contact.scss'

type Tab = 'campaigns' | 'segments' | 'subscriptions' | 'automations'

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
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [editing, setEditing] = useState<Campaign | 'new'>()
    const [report, setReport] = useState<Campaign>()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState<Campaign>()
    const [busy, setBusy] = useState(false)

    /**
     * Loads the Contact workspace resources atomically; caller handles transport errors.
     * @returns resolves after config, campaigns, and segments replace workspace state.
     * @throws Rejects on API, network, or authorization failures.
     */
    const reload = useCallback(async (): Promise<void> => {
        const [nextConfig, nextCampaigns, nextSegments, nextTemplates] = await Promise.all([
            contactGet<ContactConfig>('config'),
            contactGet<Campaign[]>('campaigns'),
            contactGet<Segment[]>('segments'),
            contactGet<EmailTemplate[]>('templates'),
        ])
        setConfig(nextConfig)
        setCampaigns(nextCampaigns)
        setSegments(nextSegments)
        setTemplates(nextTemplates)
    }, [])

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
                <nav aria-label='Contact navigation' className='contact-tabs'>
                    {(['campaigns', 'segments', 'subscriptions', 'automations'] as const).map(
                        value => (
                            <button
                                type='button'
                                key={value}
                                aria-current={tab === value ? 'page' : undefined}
                                onClick={() => setTab(value)}
                            >
                                {value.charAt(0)
                                    .toUpperCase() + value.slice(1)}
                            </button>
                        ),
                    )}
                </nav>
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
                <>
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
                        <SegmentManager segments={segments} onRefresh={reload} />
                    )}
                    {tab === 'subscriptions' && (
                        <SubscriptionManager types={config.subscriptionTypes} onRefresh={reload} />
                    )}
                </>
            )}
        </main>
    )
}

export default ContactApp
