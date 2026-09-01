/** Contained loading state for an Analytics report body. */
import { FC } from 'react'

import { LoadingSpinner } from '~/libs/ui'

import styles from './AnalyticsLoadingState.module.scss'

interface AnalyticsLoadingStateProps {
    message: string
}

/**
 * Renders a report spinner inside normal page flow without covering filters or navigation.
 *
 * @param props accessible loading message shown beside the spinner.
 * @returns fixed-height status region that contains the shared absolute spinner.
 * @throws Does not throw.
 */
export const AnalyticsLoadingState: FC<AnalyticsLoadingStateProps> = props => (
    <section aria-label={props.message} className={styles.region} role='status'>
        <LoadingSpinner message={props.message} />
    </section>
)

export default AnalyticsLoadingState
