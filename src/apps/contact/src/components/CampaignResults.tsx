/* Form callbacks capture the current field and draft state. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, useEffect, useState } from 'react'

import { Campaign, CampaignReport, RecipientPage } from '../contact.models'
import { contactError, contactGet } from '../contact.service'

interface Props {
    campaign: Campaign
    onClose: () => void
}

/**
 * Loads actual delivery and tracking results plus paginated recipient outcomes for a campaign.
 * @param props the selected campaign and return-navigation callback.
 * @returns metrics, device/link detail, and outcome filtering with explicit telemetry caveats.
 * @throws Fetch failures are shown inline, preserving existing results until a successful refresh.
 */
export const CampaignResults: FC<Props> = props => {
    const [report, setReport] = useState<CampaignReport>()
    const [recipients, setRecipients] = useState<RecipientPage>()
    const [status, setStatus] = useState('')
    const [offset, setOffset] = useState(0)
    const [refresh, setRefresh] = useState(0)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        let mounted = true
        setBusy(true)
        setError('')
        const query = new URLSearchParams({ limit: '100', offset: String(offset) })
        if (status) query.set('status', status)
        Promise.all([
            contactGet<CampaignReport>(`campaigns/${props.campaign.id}/report`),
            contactGet<RecipientPage>(
                `campaigns/${props.campaign.id}/recipients?${query.toString()}`,
            ),
        ])
            .then(([metrics, page]) => {
                if (mounted) {
                    setReport(metrics)
                    setRecipients(page)
                }
            })
            .catch(failure => {
                if (mounted) setError(contactError(failure))
            })
            .finally(() => {
                if (mounted) setBusy(false)
            })
        return () => {
            mounted = false
        }
    }, [props.campaign.id, offset, status, refresh])

    return (
        <section>
            <div className='contact-toolbar'>
                <button type='button' onClick={props.onClose}>
                    Back to campaigns
                </button>
                <h2>{props.campaign.name}</h2>
                <span>{props.campaign.status}</span>
                <button type='button' disabled={busy} onClick={() => setRefresh(value => value + 1)}>
                    Refresh results
                </button>
            </div>
            {error && (
                <p role='alert' className='contact-error'>
                    {error}
                </p>
            )}
            {busy && <p role='status'>Loading campaign results…</p>}
            {report && (
                <>
                    <div className='contact-metrics'>
                        {(
                            [
                                ['recipientCount', 'Audience'],
                                ['sent', 'Sent'],
                                ['delivered', 'Delivered'],
                                ['opened', 'Opened'],
                                ['clicked', 'Clicked'],
                                ['bounced', 'Bounced'],
                                ['complained', 'Spam reports'],
                                ['unsubscribed', 'Unsubscribed'],
                                ['skipped', 'Not sent'],
                                ['failed', 'Failed'],
                                ['uncertain', 'Uncertain'],
                            ] as const
                        ).map(([key, label]) => (
                            <div key={key}>
                                <span>{label}</span>
                                <strong>{report[key].toLocaleString()}</strong>
                            </div>
                        ))}
                    </div>
                    <div className='contact-metrics'>
                        {(
                            [
                                ['openRate', 'Open rate'],
                                ['clickRate', 'Click rate'],
                                ['clickThroughRate', 'Click-through rate'],
                            ] as const
                        ).map(([key, label]) => (
                            <div key={key}>
                                <span>{label}</span>
                                <strong>
                                    {report[key].toFixed(2)}
                                    %
                                </strong>
                            </div>
                        ))}
                    </div>
                    <p className='contact-help'>
                        Email privacy features and image proxies affect opens and device attribution. Time
                        spent reading, skimming, or glancing cannot be measured reliably.
                    </p>
                    {report.warnings.map(warning => (
                        <p className='contact-warning' key={warning}>
                            {warning}
                        </p>
                    ))}
                    <div className='contact-grid'>
                        <section>
                            <h3>Tracked links</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Destination</th>
                                        <th>Clicks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.links.map(link => (
                                        <tr key={link.url}>
                                            <td className='contact-break'>{link.url}</td>
                                            <td>{link.clicks.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!report.links.length && <p>No clicks recorded.</p>}
                        </section>
                        <section>
                            <h3>Observed devices</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Device</th>
                                        <th>Events</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.devices.map(device => (
                                        <tr key={device.device}>
                                            <td>{device.device}</td>
                                            <td>{device.count.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!report.devices.length && <p>No device events recorded.</p>}
                        </section>
                    </div>
                </>
            )}
            <h3>Recipient outcomes</h3>
            <label>
                Filter outcomes
                <select
                    value={status}
                    onChange={event => {
                        setStatus(event.target.value)
                        setOffset(0)
                    }}
                >
                    <option value=''>All outcomes</option>
                    {[
                        'sent',
                        'delivered',
                        'opened',
                        'clicked',
                        'bounced',
                        'complained',
                        'unsubscribed',
                        'skipped',
                        'failed',
                        'uncertain',
                        'queued',
                        'sending',
                    ].map(value => (
                        <option key={value} value={value}>
                            {value}
                        </option>
                    ))}
                </select>
            </label>
            {recipients && (
                <>
                    <div className='contact-table-scroll'>
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Sent</th>
                                    <th>Opened</th>
                                    <th>Clicked</th>
                                    <th>Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipients.items.map(member => (
                                    <tr key={member.id}>
                                        <td>{member.handle}</td>
                                        <td>{member.email}</td>
                                        <td>{member.status}</td>
                                        <td>
                                            {member.sentAt ? new Date(member.sentAt)
                                                .toLocaleString() : '—'}
                                        </td>
                                        <td>
                                            {member.openedAt
                                                ? new Date(member.openedAt)
                                                    .toLocaleString()
                                                : '—'}
                                        </td>
                                        <td>
                                            {member.clickedAt
                                                ? new Date(member.clickedAt)
                                                    .toLocaleString()
                                                : '—'}
                                        </td>
                                        <td>{member.reason || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!recipients.items.length && <p>No matching recipient outcomes.</p>}
                    <div className='contact-toolbar'>
                        <button
                            type='button'
                            disabled={!offset || busy}
                            onClick={() => setOffset(Math.max(0, offset - 100))}
                        >
                            Previous
                        </button>
                        <span>
                            {recipients.total ? offset + 1 : 0}
                            –
                            {Math.min(offset + 100, recipients.total)}
                            {' '}
                            of
                            {' '}
                            {recipients.total.toLocaleString()}
                        </span>
                        <button
                            type='button'
                            disabled={offset + 100 >= recipients.total || busy}
                            onClick={() => setOffset(offset + 100)}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </section>
    )
}
