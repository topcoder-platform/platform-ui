/** URL-driven ticket status tabs. */
import { FC } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { buildSupportPath } from '../../../config/routes.config'

import styles from './SupportTabs.module.scss'

export interface SupportTabsProps {
    active: 'open' | 'closed'
}

/**
 * Renders accessible Open and Closed ticket navigation.
 *
 * @param props active status tab.
 * @returns ticket status navigation.
 * @throws Does not throw.
 */
export const SupportTabs: FC<SupportTabsProps> = props => (
    <nav aria-label='Support ticket status' className={styles.tabs}>
        <Link
            aria-current={props.active === 'open' ? 'page' : undefined}
            className={classNames(styles.tab, props.active === 'open' && styles.active)}
            to={buildSupportPath()}
        >
            Open tickets
        </Link>
        <Link
            aria-current={props.active === 'closed' ? 'page' : undefined}
            className={classNames(styles.tab, props.active === 'closed' && styles.active)}
            to={buildSupportPath('closed')}
        >
            Closed tickets
        </Link>
    </nav>
)
