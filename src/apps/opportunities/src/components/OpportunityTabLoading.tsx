import { FC } from 'react'

import { LoadingSpinner } from '~/libs/ui'

import styles from './OpportunityTabLoading.module.scss'

interface OpportunityTabLoadingProps {
    label: string
}

/**
 * Keeps an opportunity detail loading state inside the active tab panel.
 *
 * @param props accessible label describing the tab content being loaded.
 * @returns an inline loading indicator that leaves the detail header and tabs visible.
 * @throws Does not throw.
 */
export const OpportunityTabLoading: FC<OpportunityTabLoadingProps> = props => (
    <div aria-label={props.label} className={styles.loading} role='status'>
        <LoadingSpinner className={styles.spinner} inline />
    </div>
)
