/* Form callbacks capture the current field and draft state. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, useEffect, useRef, useState } from 'react'

import { getAnalyticsFilters } from '~/apps/analytics/src/lib/services/analytics.service'

import {
    AudiencePreview,
    Campaign,
    CampaignInput,
    ContactConfig,
    EmailPreview,
    EmailTemplate,
    Segment,
} from '../contact.models'
import { contactError, contactGet, contactPatch, contactPost } from '../contact.service'

import { EmailEditor, STARTER_EMAIL } from './EmailEditor'
import { SegmentFields } from './SegmentFields'

const ANALYTICS_TOKEN = /^[A-Za-z0-9._~-]{0,100}$/

interface Props {
    campaign?: Campaign
    config: ContactConfig
    segments: Segment[]
    templates: EmailTemplate[]
    onTemplateSaved: (template: EmailTemplate) => void
    onSaved: (campaign: Campaign) => void
    onClose: () => void
}

/**
 * Creates an editable campaign input without server-owned metadata or a blank starter email.
 * @param config server configuration containing allowed subscription categories.
 * @param campaign optional persisted campaign whose writable fields are copied.
 * @returns only API-approved editable fields, or an unsaved Topcoder starter draft.
 * @throws Does not throw.
 */
function initialCampaign(config: ContactConfig, campaign?: Campaign): CampaignInput {
    if (campaign) {
        return {
            campaign: campaign.campaign,
            campaignId: campaign.campaignId,
            editorDesign: campaign.editorDesign,
            excludeUnengagedDays: campaign.excludeUnengagedDays,
            html: campaign.html,
            name: campaign.name,
            pageTitle: campaign.pageTitle,
            segment: campaign.segment,
            source: campaign.source,
            subject: campaign.subject,
            subscriptionTypeId: campaign.subscriptionTypeId,
            text: campaign.text,
            trackingEnabled: campaign.trackingEnabled,
        }
    }

    return {
        html: STARTER_EMAIL,
        name: '',
        segment: {},
        source: 'topcoder',
        subject: '',
        subscriptionTypeId: config.subscriptionTypes.find(type => type.active)?.id || '',
        trackingEnabled: true,
    }
}

/**
 * Displays the email authoring, audience snapshot, personalization, and two-step send workflow.
 * @param props saved campaign (when editing), server config, saved segments, and navigation callbacks.
 * @returns the editor with server-backed previews and exact frozen audience approval.
 * @throws Request failures are caught and displayed in the composer; the editor has its own boundary.
 */
export const CampaignComposer: FC<Props> = props => {
    const [draft, setDraft] = useState<CampaignInput>(initialCampaign(props.config, props.campaign))
    const [saved, setSaved] = useState<Campaign | undefined>(props.campaign)
    const [dirty, setDirty] = useState(!props.campaign)
    const [busy, setBusy] = useState(false)
    const [templateName, setTemplateName] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState('')
    const [editorRevision, setEditorRevision] = useState(0)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [audience, setAudience] = useState<AudiencePreview>()
    const [pollRetry, setPollRetry] = useState(0)
    const [pollError, setPollError] = useState('')
    const [preview, setPreview] = useState<EmailPreview>()
    const [memberId, setMemberId] = useState('')
    const [mobile, setMobile] = useState(false)
    const [scheduledAt, setScheduledAt] = useState('')
    const [review, setReview] = useState(false)
    const [confirmed, setConfirmed] = useState(false)
    const [campaignNames, setCampaignNames] = useState<string[]>([])
    const [analyticsError, setAnalyticsError] = useState('')
    const changeVersion = useRef(0)
    const [clockNow, setClockNow] = useState(Date.now())

    useEffect(() => {
        let mounted = true
        getAnalyticsFilters()
            .then(options => {
                if (mounted) {
                    setCampaignNames(options.campaigns.filter(name => ANALYTICS_TOKEN.test(name)))
                    if (options.campaigns.some(name => !ANALYTICS_TOKEN.test(name))) {
                        setAnalyticsError('Some suggestions use unsupported analytics tokens. '
                            + 'Use letters, numbers, dot, underscore, tilde, or hyphen.')
                    }
                }
            })
            .catch(() => {
                if (mounted) {
                    setAnalyticsError(
                        'Campaign suggestions are unavailable. Enter an existing analytics campaign name.',
                    )
                }
            })
        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        const timer = window.setInterval(() => setClockNow(Date.now()), 15_000)
        return () => window.clearInterval(timer)
    }, [])

    useEffect(() => {
        if (audience?.status !== 'pending') return undefined
        let mounted = true
        const timer = window.setTimeout(() => {
            contactGet<AudiencePreview>(`audience/${encodeURIComponent(audience.audienceToken)}`)
                .then(result => {
                    if (mounted) { setAudience(result); setPollError('') }
                })
                .catch(failure => {
                    if (mounted) {
                        setPollError(
                            `Audience status temporarily unavailable; retrying the same snapshot. ${contactError(
                                failure,
                            )}`,
                        )
                        setPollRetry(value => value + 1)
                    }
                })
        }, 2000)
        return () => {
            mounted = false
            window.clearTimeout(timer)
        }
    }, [audience, pollRetry])

    useEffect(() => {
        /**
         * Warns about unsaved email edits when the browser navigates away.
         * @param event browser unload event.
         * @returns void after requesting the browser unsaved-edits prompt when needed.
         * @throws Does not throw.
         */
        const preventLoss = (event: BeforeUnloadEvent): void => {
            if (!dirty) return
            event.preventDefault()
            event.returnValue = ''
        }

        window.addEventListener('beforeunload', preventLoss)
        return () => window.removeEventListener('beforeunload', preventLoss)
    }, [dirty])

    /**
     * Updates edited fields, invalidating prior personalized previews and approval snapshots.
     * @param fields changed campaign fields merged into the current draft.
     * @returns void after invalidating saved-preview approval state.
     * @throws Does not throw.
     */
    function change(fields: Partial<CampaignInput>): void {
        changeVersion.current += 1
        setDraft(previous => ({ ...previous, ...fields }))
        setDirty(true)
        setAudience(undefined)
        setPollError('')
        setPreview(undefined)
        setReview(false)
        setConfirmed(false)
    }

    /**
     * Runs an asynchronous composer action, showing failures without discarding the draft.
     * @param action asynchronous operation to execute while form controls are disabled.
     * @returns resolves when the action ends and busy state resets.
     * @throws Does not throw; request errors appear above the editor.
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
     * Persists the current revision and returns it; rejects if inputs are missing or an API write fails.
     * @returns authoritative saved campaign including its updated revision.
     * @throws Error on missing required inputs, concurrent local edits, or API write failure.
     */
    async function save(): Promise<Campaign> {
        if (!draft.name.trim() || !draft.subject.trim() || !draft.subscriptionTypeId) {
            throw new Error('Enter a campaign name, subject, and subscription type before continuing.')
        }

        if ([draft.campaign, draft.campaignId, draft.source].some(value => !ANALYTICS_TOKEN.test(value || ''))) {
            throw new Error('Analytics campaign, ID, and source must use at most 100 letters, numbers, '
                + 'dots, underscores, tildes, or hyphens.')
        }

        if (saved && !dirty) return saved
        const version = changeVersion.current
        const result = saved
            ? await contactPatch<Campaign>(`campaigns/${saved.id}`, { ...draft, revision: saved.revision })
            : await contactPost<Campaign>('campaigns', draft)
        setSaved(result)
        props.onSaved(result)
        if (version !== changeVersion.current) {
            throw new Error(
                'The email changed while saving. Save again before previewing or approving an audience.',
            )
        }

        setDirty(false)
        setMessage('Draft saved.')
        return result
    }

    /**
     * Saves the current authored content as a reusable template, without storing audience settings.
     * @returns resolves after adding the new template to the parent workspace library.
     * @throws Error on a missing name or API validation/write failure.
     */
    async function saveTemplate(): Promise<void> {
        if (!templateName.trim()) throw new Error('Enter a name for this reusable template.')
        const template = await contactPost<EmailTemplate>('templates', {
            editorDesign: draft.editorDesign, html: draft.html, name: templateName,
        })
        props.onTemplateSaved(template)
        setTemplateName('')
        setMessage('Reusable template saved.')
    }

    /**
     * Replaces the current authored body with the selected reusable template.
     * @returns void after invalidating previews and remounting the editor with the chosen design.
     * @throws Does not throw; unavailable template selections are ignored.
     */
    function applyTemplate(): void {
        const template = props.templates.find(item => item.id === selectedTemplate)
        if (!template) return
        change({ editorDesign: template.editorDesign, html: template.html })
        setEditorRevision(value => value + 1)
    }

    /**
     * Saves the latest content before requesting an immutable server-side recipient snapshot.
     * @returns resolves after snapshot creation and stores its pending/ready status for polling.
     * @throws Rejects on save, validation, or snapshot request failure.
     */
    async function calculateAudience(): Promise<void> {
        const campaign = await save()
        setAudience(await contactPost<AudiencePreview>('audience/preview', { campaignId: campaign.id }))
        setReview(false)
    }

    /**
     * Renders the saved campaign as the admin or selected member, including the mandatory service footer.
     * @returns resolves after storing the server-rendered personalized preview.
     * @throws Rejects on save, member lookup, or rendering API failure.
     */
    async function previewEmail(): Promise<void> {
        const campaign = await save()
        setPreview(
            await contactPost<EmailPreview>(`campaigns/${campaign.id}/preview`, {
                memberId: memberId.trim() || undefined,
            }),
        )
    }

    /**
     * Sends a saved test only to the authenticated administrator's account email.
     * @returns resolves after SES accepts the test request and the destination is displayed.
     * @throws Rejects on save or test-send API failure.
     */
    async function sendTest(): Promise<void> {
        const campaign = await save()
        const result = await contactPost<{ email: string }>(`campaigns/${campaign.id}/test`, {})
        setMessage(`Test email sent to ${result.email}.`)
    }

    /**
     * Confirms a ready immutable audience and starts delivery; the API rejects stale approvals.
     * @returns resolves after send/schedule acceptance and closes the composer.
     * @throws Error on missing approval, expired snapshot, invalid date, or API concurrency failure.
     */
    async function send(): Promise<void> {
        if (!saved || !audience || audience.status !== 'ready' || !confirmed || dirty) {
            throw new Error('Save the draft and approve a completed audience snapshot first.')
        }

        if (new Date(audience.expiresAt)
            .getTime() <= Date.now()) {
            throw new Error('The audience snapshot expired. Recalculate it before sending.')
        }

        const instant = scheduledAt ? new Date(scheduledAt) : undefined
        if (instant && (!Number.isFinite(instant.getTime()) || instant.getTime() <= Date.now())) {
            throw new Error('Choose a future date and time to schedule this email.')
        }

        const result = await contactPost<Campaign>(`campaigns/${saved.id}/${instant ? 'schedule' : 'send'}`, {
            audienceToken: audience.audienceToken,
            confirmedRecipientCount: audience.recipientCount,
            scheduledAt: instant?.toISOString(),
        })
        props.onSaved(result)
        props.onClose()
    }

    const ready
        = audience?.status === 'ready'
        && !dirty
        && new Date(audience.expiresAt)
            .getTime() > clockNow
        && audience.recipientCount > 0
    const rawBytes = new TextEncoder()
        .encode(draft.html).length

    return (
        <section className='contact-composer'>
            <div className='contact-toolbar'>
                <button type='button' onClick={props.onClose} disabled={busy}>
                    Back to campaigns
                </button>
                <h2>{saved ? 'Edit campaign' : 'New campaign'}</h2>
                <span>{dirty ? 'Unsaved changes' : 'Saved'}</span>
                <button
                    type='button'
                    className='contact-primary'
                    disabled={busy}
                    onClick={() => run(async () => {
                        await save()
                    })}
                >
                    Save draft
                </button>
            </div>
            {error && (
                <p role='alert' className='contact-error'>
                    {error}
                </p>
            )}
            {pollError && <p className='contact-warning' role='status'>{pollError}</p>}
            {message && (
                <p role='status' className='contact-success'>
                    {message}
                </p>
            )}
            <fieldset disabled={busy} className='contact-fields'>
                <legend>1. Compose</legend>
                <div className='contact-grid'>
                    <label>
                        Campaign name
                        <input
                            value={draft.name}
                            onChange={event => change({ name: event.target.value })}
                        />
                    </label>
                    <label>
                        Email subject
                        <input
                            value={draft.subject}
                            onChange={event => change({ subject: event.target.value })}
                        />
                    </label>
                    <label>
                        Browser page title
                        <input
                            value={draft.pageTitle || ''}
                            onChange={event => change({ pageTitle: event.target.value })}
                        />
                    </label>
                    <label>
                        Subscription type
                        <select
                            value={draft.subscriptionTypeId}
                            onChange={event => change({ subscriptionTypeId: event.target.value })}
                        >
                            <option value=''>Select a subscription type</option>
                            {props.config.subscriptionTypes
                                .filter(type => type.active)
                                .map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                        </select>
                    </label>
                    <label>
                        Analytics marketing campaign
                        <input
                            list='contact-analytics-campaigns'
                            value={draft.campaign || ''}
                            onChange={event => change({ campaign: event.target.value })}
                        />
                        <datalist id='contact-analytics-campaigns'>
                            {campaignNames.map(name => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </datalist>
                    </label>
                    <label>
                        Analytics campaign ID (optional)
                        <input
                            value={draft.campaignId || ''}
                            onChange={event => change({ campaignId: event.target.value })}
                        />
                    </label>
                    <label>
                        UTM source
                        <input
                            value={draft.source || ''}
                            onChange={event => change({ source: event.target.value })}
                        />
                    </label>
                    <label className='contact-check'>
                        <input
                            type='checkbox'
                            checked={draft.trackingEnabled}
                            onChange={event => change({ trackingEnabled: event.target.checked })}
                        />
                        Track opens and clicks
                    </label>
                </div>
                {analyticsError && <p className='contact-help'>{analyticsError}</p>}
                <p className='contact-help'>
                    Analytics tokens allow letters, numbers, dots, underscores, tildes, and hyphens (100 characters).
                    Links use email as the UTM medium. Campaign names and IDs connect email visits with the
                    analytics funnel.
                </p>
                <p className='contact-help'>
                    Merge fields:
                    {' '}
                    {props.config.mergeFields.join(', ')}
                    . Example fallback:
                    {' '}
                    {'{{firstName|there}}'}
                    . The service adds the address, browser link, unsubscribe link, and
                    preferences footer.
                </p>
                <div className='contact-toolbar'>
                    <label>
                        Saved email template
                        <select
                            value={selectedTemplate}
                            onChange={event => setSelectedTemplate(event.target.value)}
                        >
                            <option value=''>Choose a reusable layout</option>
                            {props.templates.map(template => (
                                <option
                                    key={template.id}
                                    value={template.id}
                                >
                                    {template.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button type='button' disabled={!selectedTemplate} onClick={applyTemplate}>
                        Replace content with template
                    </button>
                    <label>
                        Reusable template name
                        <input
                            value={templateName}
                            onChange={event => setTemplateName(event.target.value)}
                        />
                    </label>
                    <button type='button' onClick={() => run(saveTemplate)}>Save content as template</button>
                </div>
                <div className={busy ? 'contact-editor-busy' : ''}>
                    <EmailEditor
                        key={editorRevision}
                        html={draft.html}
                        design={draft.editorDesign}
                        onChange={(html, editorDesign) => change({ editorDesign, html })}
                    />
                </div>
                <p className={rawBytes >= props.config.clippingLimitBytes ? 'contact-error' : 'contact-help'}>
                    Draft HTML:
                    {' '}
                    {(rawBytes / 1024).toFixed(1)}
                    {' '}
                    KB. Clipping threshold:
                    {' '}
                    {(props.config.clippingLimitBytes / 1024).toFixed(0)}
                    {' '}
                    KB. Personalized size including the
                    footer is shown in preview and audience review.
                </p>
                <label>
                    Plain-text alternative (optional)
                    <textarea
                        rows={4}
                        value={draft.text || ''}
                        onChange={event => change({ text: event.target.value })}
                    />
                </label>
            </fieldset>
            <fieldset disabled={busy} className='contact-fields'>
                <legend>2. Select recipients</legend>
                <label>
                    Start from a saved segment
                    <select
                        defaultValue=''
                        onChange={event => {
                            const segment = props.segments.find(item => item.id === event.target.value)
                            if (segment) change({ segment: segment.filter })
                        }}
                    >
                        <option value=''>Custom member criteria</option>
                        {props.segments.map(segment => (
                            <option key={segment.id} value={segment.id}>
                                {segment.name}
                            </option>
                        ))}
                    </select>
                </label>
                <SegmentFields value={draft.segment} onChange={segment => change({ segment })} />
                <label>
                    Exclude members with no email engagement in the last N days (optional)
                    <input
                        type='number'
                        min='1'
                        max='3650'
                        value={draft.excludeUnengagedDays ?? ''}
                        onChange={event => change({
                            excludeUnengagedDays: event.target.value
                                ? Number(event.target.value)
                                : undefined,
                        })}
                    />
                </label>
                <p className='contact-help'>
                    Only members subscribed to this category and eligible for email are included. The approved
                    audience is frozen; later opt-outs, suppressions, and inactive accounts can reduce
                    delivery.
                </p>
                <button type='button' onClick={() => run(calculateAudience)}>
                    Save and calculate exact audience
                </button>
                {audience && (
                    <div className='contact-audience' aria-live='polite'>
                        <h3>
                            {audience.status === 'pending'
                                ? 'Preparing recipient snapshot…'
                                : audience.status === 'failed'
                                    ? 'Audience calculation failed'
                                    : `${audience.recipientCount.toLocaleString()} emails in this audience`}
                        </h3>
                        {audience.status === 'pending' && (
                            <p>
                                This may take several minutes for large member segments. Keep this page open.
                            </p>
                        )}
                        {audience.status === 'ready' && (
                            <>
                                <p>
                                    {audience.excludedCount.toLocaleString()}
                                    {' '}
                                    excluded · Estimated SES cost
                                    {' '}
                                    <strong>
                                        $
                                        {audience.estimatedCostUsd.toFixed(2)}
                                        {' '}
                                        USD
                                    </strong>
                                    {' '}
                                    · Largest
                                    email
                                    {(audience.maxEmailBytes / 1024).toFixed(1)}
                                    {' '}
                                    KB
                                </p>
                                <p className='contact-help'>
                                    SES $
                                    {props.config.pricing.perThousandEmails.toFixed(2)}
                                    {' '}
                                    per 1,000 emails
                                    plus $
                                    {props.config.pricing.perGbData.toFixed(2)}
                                    {' '}
                                    per GB. Estimate
                                    excludes infrastructure and optional services.
                                    {' '}
                                    <a href={props.config.pricing.sourceUrl} target='_blank' rel='noreferrer'>
                                        Pricing source
                                    </a>
                                </p>
                                <p className='contact-help'>
                                    Snapshot valid until
                                    {' '}
                                    {new Date(audience.expiresAt)
                                        .toLocaleString()}
                                    .
                                    {' '}
                                    {ready ? '' : 'Refresh the snapshot before approval.'}
                                </p>
                                {audience.sample.length > 0 && (
                                    <details>
                                        <summary>Sample recipients</summary>
                                        <ul>
                                            {audience.sample.map(member => (
                                                <li key={member.memberId}>
                                                    {member.handle}
                                                    {' '}
                                                    ·
                                                    {member.email}
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                )}
                            </>
                        )}
                        {audience.warnings.map(warning => (
                            <p className='contact-warning' key={warning}>
                                {warning}
                            </p>
                        ))}
                    </div>
                )}
            </fieldset>
            <fieldset disabled={busy} className='contact-fields'>
                <legend>3. Preview and test</legend>
                <div className='contact-toolbar'>
                    <label>
                        Preview member ID (optional)
                        <input
                            value={memberId}
                            onChange={event => setMemberId(event.target.value)}
                            placeholder='Your account by default'
                        />
                    </label>
                    <button type='button' onClick={() => run(previewEmail)}>
                        Preview personalized email
                    </button>
                    <button type='button' onClick={() => run(sendTest)}>
                        Send test to
                        {' '}
                        {props.config.testEmail}
                    </button>
                </div>
                {preview && (
                    <>
                        <div className='contact-toolbar'>
                            <strong>{preview.subject}</strong>
                            <span>
                                {(preview.emailBytes / 1024).toFixed(1)}
                                {' '}
                                KB
                            </span>
                            <button type='button' onClick={() => setMobile(!mobile)}>
                                {mobile ? 'Desktop preview' : 'Mobile preview'}
                            </button>
                        </div>
                        {preview.emailBytes >= preview.clippingLimitBytes && (
                            <p className='contact-warning'>
                                This email may be clipped. Reduce its HTML size.
                            </p>
                        )}
                        <div className='contact-preview'>
                            <iframe
                                title='Personalized email preview'
                                sandbox=''
                                srcDoc={preview.html}
                                style={{ width: mobile ? 375 : '100%' }}
                            />
                        </div>
                        <details>
                            <summary>Plain-text preview</summary>
                            <pre>{preview.text}</pre>
                        </details>
                    </>
                )}
            </fieldset>
            <fieldset disabled={busy} className='contact-fields'>
                <legend>4. Review and send</legend>
                <label>
                    Schedule (your local time; leave empty to send now)
                    <input
                        type='datetime-local'
                        value={scheduledAt}
                        onChange={event => {
                            setScheduledAt(event.target.value)
                            setReview(false)
                            setConfirmed(false)
                        }}
                    />
                </label>
                {scheduledAt && (
                    <p className='contact-help'>
                        Scheduled UTC time:
                        {' '}
                        {Number.isFinite(new Date(scheduledAt)
                            .getTime())
                            ? new Date(scheduledAt)
                                .toISOString()
                            : 'Invalid date'}
                    </p>
                )}
                {!props.config.sendingEnabled && (
                    <p className='contact-warning'>Campaign sending is disabled in this environment.</p>
                )}
                <button
                    type='button'
                    className='contact-primary'
                    disabled={!ready || !props.config.sendingEnabled}
                    onClick={() => {
                        setReview(true)
                        setConfirmed(false)
                    }}
                >
                    Review
                    {' '}
                    {scheduledAt ? 'scheduled send' : 'send'}
                </button>
                {review && audience && (
                    <div
                        className='contact-confirmation'
                        role='region'
                        aria-label='Confirm campaign delivery'
                    >
                        <h3>Confirm delivery</h3>
                        <p>
                            <strong>{draft.subject}</strong>
                            {' '}
                            from
                            {props.config.sender}
                        </p>
                        <p>
                            {audience.recipientCount.toLocaleString()}
                            {' '}
                            emails · $
                            {audience.estimatedCostUsd.toFixed(2)}
                            {' '}
                            USD estimated SES cost ·
                            {' '}
                            {scheduledAt ? new Date(scheduledAt)
                                .toLocaleString() : 'Send immediately'}
                        </p>
                        <label className='contact-check'>
                            <input
                                type='checkbox'
                                checked={confirmed}
                                onChange={event => setConfirmed(event.target.checked)}
                            />
                            I reviewed the audience, personalized content, subscription type, test email, and
                            estimated cost.
                        </label>
                        <div className='contact-toolbar'>
                            <button type='button' onClick={() => setReview(false)}>
                                Go back
                            </button>
                            <button
                                type='button'
                                className='contact-primary'
                                disabled={!confirmed || !ready || !props.config.sendingEnabled}
                                onClick={() => run(send)}
                            >
                                {scheduledAt ? 'Confirm schedule' : 'Confirm and send'}
                            </button>
                        </div>
                    </div>
                )}
            </fieldset>
        </section>
    )
}
