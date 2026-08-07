/** Shared request lifecycle states for Support pages. */
import { FC } from 'react'

import { Button, LoadingSpinner } from '~/libs/ui'

import styles from './SupportState.module.scss'

/**
 * Renders a centered accessible loading state.
 *
 * @returns loading status.
 * @throws Does not throw.
 */
export const SupportLoading: FC = () => (
    <div aria-live='polite' className={styles.state} role='status'>
        <LoadingSpinner />
        <span>Loading support tickets…</span>
    </div>
)

export interface SupportErrorProps {
    message: string
    onRetry: () => void
}

/**
 * Renders a retryable Support request error.
 *
 * @param props safe error message and retry handler.
 * @returns error alert.
 * @throws Does not throw.
 */
export const SupportError: FC<SupportErrorProps> = props => (
    <div className={styles.error} role='alert'>
        <strong>Support is temporarily unavailable</strong>
        <p>{props.message}</p>
        <Button label='Try again' onClick={props.onRetry} secondary size='md' />
    </div>
)

export interface SupportEmptyProps {
    message: string
}

/**
 * Renders a friendly empty state.
 *
 * @param props contextual empty-state message.
 * @returns empty status.
 * @throws Does not throw.
 */
export const SupportEmpty: FC<SupportEmptyProps> = props => (
    <div className={styles.state} role='status'>{props.message}</div>
)
