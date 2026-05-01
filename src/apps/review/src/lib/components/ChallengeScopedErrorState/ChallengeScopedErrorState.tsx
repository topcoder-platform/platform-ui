import { FC } from 'react'

import { Button } from '~/libs/ui'

import styles from './ChallengeScopedErrorState.module.scss'

interface ChallengeScopedErrorStateProps {
    message?: string
    onRetry: () => void
}

/**
 * Renders the shared retryable error state for challenge-scoped route fetches.
 *
 * @param props.message optional message shown in the error panel.
 * @param props.onRetry callback used by route pages to revalidate failed challenge data.
 * @returns a generic route-level error panel with a retry action.
 */
export const ChallengeScopedErrorState: FC<ChallengeScopedErrorStateProps> = (
    props: ChallengeScopedErrorStateProps,
) => (
    <div className={styles.container} role='alert'>
        <p className={styles.message}>
            {props.message ?? 'Something went wrong while loading the challenge. Please try again.'}
        </p>
        <Button
            secondary
            size='lg'
            onClick={props.onRetry}
        >
            Retry
        </Button>
    </div>
)

export default ChallengeScopedErrorState
