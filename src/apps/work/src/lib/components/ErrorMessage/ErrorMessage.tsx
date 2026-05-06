import {
    FC,
    ReactNode,
} from 'react'

import { Button } from '~/libs/ui'

import styles from './ErrorMessage.module.scss'

interface ErrorMessageProps {
    message: ReactNode
    onRetry?: () => void
}

const SUPPORT_EMAIL = 'support@topcoder.com'

/**
 * Renders the supplied error message with the Topcoder support email converted to a mailto link.
 *
 * @param message error message text or custom React content to display.
 * @returns message content with the support email linked when the message is plain text.
 * @remarks Used by ErrorMessage so project access denial messages can keep their configured copy while linking support.
 * @throws Does not throw.
 */
function renderMessage(message: ReactNode): ReactNode {
    if (typeof message !== 'string' || !message.includes(SUPPORT_EMAIL)) {
        return message
    }

    const emailIndex = message.indexOf(SUPPORT_EMAIL)

    return (
        <>
            {message.slice(0, emailIndex)}
            <a href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
            </a>
            {message.slice(emailIndex + SUPPORT_EMAIL.length)}
        </>
    )
}

export const ErrorMessage: FC<ErrorMessageProps> = (props: ErrorMessageProps) => (
    <div className={styles.container}>
        <p className={styles.message}>{renderMessage(props.message)}</p>
        {props.onRetry
            ? (
                <Button
                    label='Retry'
                    onClick={props.onRetry}
                    secondary
                    size='lg'
                />
            )
            : undefined}
    </div>
)

export default ErrorMessage
