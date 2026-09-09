/* Form callbacks capture the current automation selection and step. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'

import { Automation, Campaign, ContactConfig, SegmentFilter } from '../contact.models'
import { contactError, contactGet, contactPost } from '../contact.service'

import { SegmentFields } from './SegmentFields'

interface Props {
    campaigns: Campaign[]
    config: ContactConfig
}
interface Step {
    id: string
    campaignTemplateId: string
    delayHours: number
}

/**
 * Creates and controls member-joined email sequences with frozen templates and a reviewed daily delivery cap.
 * @param props available campaign templates and live server pricing/subscription configuration.
 * @returns the sequence library, new-sequence builder, and activation/pause controls.
 * @throws Fetch/write failures are caught and displayed, preserving the current sequence form.
 */
export const AutomationManager: FC<Props> = props => {
    const [automations, setAutomations] = useState<Automation[]>([])
    const [name, setName] = useState('')
    const [segment, setSegment] = useState<SegmentFilter>({})
    const [subscriptionTypeId, setSubscriptionTypeId] = useState('')
    const [steps, setSteps] = useState<Step[]>([
        { campaignTemplateId: '', delayHours: 0, id: uuid() },
    ])
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [review, setReview] = useState<Automation>()
    const [cap, setCap] = useState(1000)
    const [confirmed, setConfirmed] = useState(false)
    const [pausing, setPausing] = useState<Automation>()

    useEffect(() => {
        let mounted = true
        contactGet<Automation[]>('automations')
            .then(items => {
                if (mounted) setAutomations(items)
            })
            .catch(failure => {
                if (mounted) setError(contactError(failure))
            })
        return () => {
            mounted = false
        }
    }, [])

    /**
     * Runs a sequence mutation and reloads the library afterward.
     * @param action sequence creation or activation/pause request to execute.
     * @returns resolves after refreshing state and resetting busy controls.
     * @throws Does not throw; validation and request failures appear in the component alert.
     */
    async function run(action: () => Promise<void>): Promise<void> {
        setBusy(true)
        setError('')
        setMessage('')
        try {
            await action()
            setAutomations(await contactGet<Automation[]>('automations'))
        } catch (failure) {
            setError(contactError(failure))
        } finally {
            setBusy(false)
        }
    }

    /**
     * Saves a new disabled sequence after validating its ordered email steps.
     * @returns resolves after creation and resets the sequence form; no emails are sent by this action.
     * @throws Error for missing inputs, invalid step delays, or API validation/write failures.
     */
    async function create(): Promise<void> {
        if (!name.trim() || !subscriptionTypeId || steps.some(step => !step.campaignTemplateId)) {
            throw new Error(
                'Enter a sequence name, subscription type, and email template for every step.',
            )
        }

        if (
            steps.some(
                (step, index) => !Number.isFinite(step.delayHours)
                    || step.delayHours < 0
                    || (index > 0 && step.delayHours <= steps[index - 1].delayHours),
            )
        ) {
            throw new Error(
                'Delays must increase for each step and count total hours since the member joined.',
            )
        }

        await contactPost('automations', {
            name,
            segment,
            steps: steps.map(step => ({
                campaignTemplateId: step.campaignTemplateId,
                delayHours: step.delayHours,
            })),
            subscriptionTypeId,
        })
        setName('')
        setSegment({})
        setSteps([{ campaignTemplateId: '', delayHours: 0, id: uuid() }])
        setMessage('Sequence saved as a draft. Review its daily delivery cap before activation.')
    }

    /**
     * Activates or resumes the reviewed sequence with the confirmed maximum daily email count.
     * @returns resolves after activation and closes the review panel.
     * @throws Error on missing confirmation, invalid cap, or failed activation API request.
     */
    async function activate(): Promise<void> {
        if (!review || !confirmed || !Number.isInteger(cap) || cap < 1) {
            throw new Error('Confirm a positive daily email cap.')
        }

        await contactPost(`automations/${review.id}/activate`, { maxEmailsPerDay: cap, revision: review.revision })
        setReview(undefined)
        setConfirmed(false)
        setMessage('Sequence activated.')
    }

    /**
     * Pauses the selected automation after the administrator reviews pending-delivery effects.
     * @returns resolves after the API pauses new cohorts and cancels queued sequence campaigns.
     * @throws Rejects on API failure, leaving the confirmation panel open for review.
     */
    async function pause(): Promise<void> {
        if (!pausing) return
        await contactPost(`automations/${pausing.id}/pause`, {})
        setPausing(undefined)
        setMessage('Sequence paused.')
    }

    return (
        <section>
            <h2>Member onboarding sequences</h2>
            <p>
                Send an ordered series to new members who match a segment and explicitly subscribe
                to the selected category. Each delay is measured from the member joining Topcoder.
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
            <div className='contact-table-scroll'>
                <table>
                    <thead>
                        <tr>
                            <th>Sequence</th>
                            <th>Status</th>
                            <th>Enrolled / scheduled</th>
                            <th>Daily email cap</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {automations.map(automation => (
                            <tr key={automation.id}>
                                <td>
                                    {automation.name}
                                    {automation.lastError && (
                                        <p className='contact-warning'>{automation.lastError}</p>
                                    )}
                                    <br />
                                    <small>
                                        {automation.steps.length}
                                        {' '}
                                        steps
                                    </small>
                                </td>
                                <td>
                                    {automation.active
                                        ? 'Active'
                                        : automation.activatedAt
                                            ? 'Paused'
                                            : 'Draft'}
                                </td>
                                <td>
                                    {automation.enrolledCount.toLocaleString()}
                                    {' '}
                                    /
                                    {' '}
                                    {automation.scheduledCount.toLocaleString()}
                                </td>
                                <td>{automation.maxEmailsPerDay.toLocaleString()}</td>
                                <td>
                                    <div className='contact-actions'>
                                        <button
                                            type='button'
                                            disabled={busy}
                                            onClick={() => {
                                                setName(`${automation.name} copy`)
                                                setSegment(automation.segment)
                                                setSubscriptionTypeId(automation.subscriptionTypeId)
                                                setSteps(
                                                    automation.steps.map(step => ({
                                                        ...step,
                                                        id: uuid(),
                                                    })),
                                                )
                                            }}
                                        >
                                            Copy as new sequence
                                        </button>
                                        {automation.active ? (
                                            <button
                                                type='button'
                                                disabled={busy}
                                                onClick={() => setPausing(automation)}
                                            >
                                                Pause
                                            </button>
                                        ) : (
                                            <button
                                                type='button'
                                                disabled={busy || !props.config.sendingEnabled}
                                                onClick={() => {
                                                    setReview(automation)
                                                    setCap(automation.maxEmailsPerDay || 1000)
                                                    setConfirmed(false)
                                                }}
                                            >
                                                {automation.activatedAt
                                                    ? 'Review resume'
                                                    : 'Review activation'}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {!automations.length && (
                <p>No sequences yet. Save campaign drafts to use as sequence email templates.</p>
            )}
            {review && (
                <fieldset disabled={busy} className='contact-confirmation'>
                    <legend>
                        Review
                        {review.name}
                    </legend>
                    <p>
                        Activation freezes this sequence&apos;s email content and audience criteria.
                        Only eligible, subscribed members who join after the activation cutoff are
                        enrolled. Every send checks current preferences and suppression.
                    </p>
                    <ol>
                        {review.steps.map(step => (
                            <li key={step.id}>
                                {step.delayHours}
                                {' '}
                                hours after joining ·
                                {' '}
                                {props.campaigns.find(item => item.id === step.campaignTemplateId)
                                    ?.name || step.campaignTemplateId}
                            </li>
                        ))}
                    </ol>
                    <label>
                        Maximum emails per day
                        <input
                            type='number'
                            min='1'
                            step='1'
                            value={cap}
                            onChange={event => {
                                setCap(Number(event.target.value))
                                setConfirmed(false)
                            }}
                        />
                    </label>
                    <p>
                        At this cap, the configured SES message charge is up to $
                        {((cap * props.config.pricing.perThousandEmails) / 1000).toFixed(2)}
                        {' '}
                        USD per
                        day, plus email data at $
                        {props.config.pricing.perGbData.toFixed(2)}
                        {' '}
                        per GB
                        and infrastructure. Actual sends depend on new eligible members and sequence
                        steps.
                    </p>
                    <label className='contact-check'>
                        <input
                            type='checkbox'
                            checked={confirmed}
                            onChange={event => setConfirmed(event.target.checked)}
                        />
                        I reviewed each email, category, segment, timing, and daily email cap and estimated cost.
                    </label>
                    <div className='contact-toolbar'>
                        <button type='button' onClick={() => setReview(undefined)}>
                            Go back
                        </button>
                        <button
                            type='button'
                            className='contact-primary'
                            disabled={!confirmed || !props.config.sendingEnabled}
                            onClick={() => run(activate)}
                        >
                            Confirm
                            {' '}
                            {review.activatedAt ? 'resume' : 'activation'}
                        </button>
                    </div>
                </fieldset>
            )}
            {pausing && (
                <div className='contact-confirmation'>
                    <h3>
                        Pause
                        {pausing.name}
                        ?
                    </h3>
                    <p>
                        New enrollments and queued sequence sends will stop. Messages already handed
                        to SES cannot be recalled.
                    </p>
                    <div className='contact-toolbar'>
                        <button type='button' disabled={busy} onClick={() => setPausing(undefined)}>
                            Keep active
                        </button>
                        <button type='button' disabled={busy} onClick={() => run(pause)}>
                            Confirm pause
                        </button>
                    </div>
                </div>
            )}
            <fieldset disabled={busy} className='contact-fields'>
                <legend>New sequence</legend>
                <div className='contact-grid'>
                    <label>
                        Sequence name
                        <input value={name} onChange={event => setName(event.target.value)} />
                    </label>
                    <label>
                        Subscription type
                        <select
                            value={subscriptionTypeId}
                            onChange={event => {
                                setSubscriptionTypeId(event.target.value)
                                setSteps([{ campaignTemplateId: '', delayHours: 0, id: uuid() }])
                            }}
                        >
                            <option value=''>Choose a category</option>
                            {props.config.subscriptionTypes
                                .filter(type => type.active)
                                .map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                        </select>
                    </label>
                </div>
                <SegmentFields value={segment} onChange={setSegment} />
                <h3>Email steps</h3>
                {steps.map((step, index) => (
                    <div className='contact-toolbar' key={step.id}>
                        <label>
                            Step
                            {' '}
                            {index + 1}
                            {' '}
                            email
                            <select
                                value={step.campaignTemplateId}
                                onChange={event => setSteps(previous => previous.map(item => (item.id === step.id
                                    ? {
                                        ...item,
                                        campaignTemplateId: event.target.value,
                                    }
                                    : item)))}
                            >
                                <option value=''>Select a saved draft</option>
                                {props.campaigns
                                    .filter(
                                        item => item.status.toLowerCase() === 'draft'
                                            && item.subscriptionTypeId === subscriptionTypeId,
                                    )
                                    .map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                            </select>
                        </label>
                        <label>
                            Hours after joining
                            <input
                                type='number'
                                min='0'
                                value={step.delayHours}
                                onChange={event => setSteps(previous => previous.map(item => (item.id === step.id
                                    ? {
                                        ...item,
                                        delayHours: Number(event.target.value),
                                    }
                                    : item)))}
                            />
                        </label>
                        <button
                            type='button'
                            disabled={steps.length === 1}
                            onClick={() => setSteps(previous => previous.filter(item => item.id !== step.id))}
                        >
                            Remove step
                        </button>
                    </div>
                ))}
                <div className='contact-toolbar'>
                    <button
                        type='button'
                        disabled={steps.length >= 20}
                        onClick={() => setSteps(previous => [
                            ...previous,
                            {
                                campaignTemplateId: '',
                                delayHours: previous[previous.length - 1].delayHours + 24,
                                id: uuid(),
                            },
                        ])}
                    >
                        Add email step
                    </button>
                    <button type='button' className='contact-primary' onClick={() => run(create)}>
                        Save sequence draft
                    </button>
                </div>
            </fieldset>
        </section>
    )
}
