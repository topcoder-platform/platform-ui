/** Retryable analytics request failure state. */
import { FC } from 'react'

import { Button, IconOutline } from '~/libs/ui'

import { AnalyticsRequestError } from '../../models'

import styles from './ReportError.module.scss'

interface ReportErrorProps {
    error: AnalyticsRequestError
    onRetry: () => void
}

/**
 * Renders a sanitized analytics error with an explicit retry action.
 *
 * @param props safe error and retry callback.
 * @returns accessible inline alert.
 * @throws Does not throw.
 */
export const ReportError: FC<ReportErrorProps> = props => (
    <section className={styles.error} role='alert'>
        <IconOutline.ExclamationCircleIcon aria-hidden='true' />
        <div>
            <h2>Unable to load analytics</h2>
            <p>{props.error.message}</p>
            <Button onClick={props.onRetry} secondary>Try again</Button>
        </div>
    </section>
)

export default ReportError
