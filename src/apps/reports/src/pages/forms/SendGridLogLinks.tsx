import { FC } from 'react'

import styles from './FormsPage.module.scss'

/** Report column holding the SendGrid message IDs of the emails sent for a submission. */
export const sendGridMessageIdsColumn = 'sendgrid_message_ids'

/** Answer key holding the submitter's email address on the forms that send email. */
export const submitterEmailColumn = 'email'

/**
 * Builds a SendGrid Email Logs search for the messages sent to one address.
 * SendGrid's API returns only the X-Message-Id prefix, not the per-recipient ID its log
 * pages need, so the report links to a recipient search instead of a single message.
 * @param email Recipient address. @returns Absolute SendGrid URL.
 * @throws Does not throw.
 */
export function sendGridSearchUrl(email: string): string {
    return `https://app.sendgrid.com/email_logs?${new URLSearchParams({ recipientEmail: email })}`
}

/**
 * Narrows a report cell to its message IDs.
 * @param value API cell value. @returns Non-empty string IDs; anything else yields none.
 * @throws Does not throw.
 */
export function sendGridMessageIds(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((id): id is string => typeof id === 'string' && id.trim() !== '')
        : []
}

/**
 * Links a submission to a SendGrid search for its submitter's emails, and lists the
 * message IDs email-service-v6 recorded for it.
 * @param props Message ID cell, submitter email answer, and the text shown when there is neither.
 * @returns The search link and IDs, or the empty text (a dash by default).
 * @throws Does not throw.
 */
const SendGridLogLinks: FC<{ value: unknown, email: unknown, empty?: string }> = (
    props: { value: unknown, email: unknown, empty?: string },
) => {
    const ids = sendGridMessageIds(props.value)
    const email = typeof props.email === 'string' ? props.email.trim() : ''
    if (!email && ids.length === 0) return <>{props.empty ?? '—'}</>

    return (
        <span className={styles.emailLogLinks}>
            {email && (
                <a href={sendGridSearchUrl(email)} target='_blank' rel='noopener noreferrer'>
                    View SendGrid logs
                </a>
            )}
            {ids.length > 0 && (
                <span>
                    {ids.length > 1 ? 'SendGrid message IDs: ' : 'SendGrid message ID: '}
                    {ids.map((id, index) => (
                        <span key={id}>
                            {index > 0 && ', '}
                            <code>{id}</code>
                        </span>
                    ))}
                </span>
            )}
        </span>
    )
}

export default SendGridLogLinks
