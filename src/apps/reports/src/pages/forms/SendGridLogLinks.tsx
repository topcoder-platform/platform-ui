import { FC } from 'react'

import styles from './FormsPage.module.scss'

/** Report column holding the SendGrid message IDs of the emails sent for a submission. */
export const sendGridMessageIdsColumn = 'sendgrid_message_ids'

/**
 * Builds the SendGrid Email Logs page for one sent message.
 * @param messageId SendGrid message ID recorded by email-service-v6. @returns Absolute SendGrid URL.
 * @throws Does not throw.
 */
export function sendGridLogUrl(messageId: string): string {
    return `https://app.sendgrid.com/email_logs/${encodeURIComponent(messageId)}/details`
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
 * Links each email sent for a submission to its SendGrid log, numbering them when there are several.
 * @param props Report cell value and the text shown when no email was recorded (a dash by default).
 * @returns Links opening SendGrid in a new tab, or the empty text.
 * @throws Does not throw.
 */
const SendGridLogLinks: FC<{ value: unknown, empty?: string }> = (props: { value: unknown, empty?: string }) => {
    const ids = sendGridMessageIds(props.value)
    if (ids.length === 0) return <>{props.empty ?? '—'}</>

    return (
        <span className={styles.emailLogLinks}>
            {ids.map((id, index) => (
                <a key={id} href={sendGridLogUrl(id)} target='_blank' rel='noopener noreferrer'>
                    {ids.length > 1 ? `View SendGrid logs (${index + 1})` : 'View SendGrid logs'}
                </a>
            ))}
        </span>
    )
}

export default SendGridLogLinks
