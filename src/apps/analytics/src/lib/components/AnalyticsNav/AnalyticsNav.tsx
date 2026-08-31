/* eslint-disable react/jsx-no-bind */
/* eslint-disable ordered-imports/ordered-imports */
/** URL-driven desktop and mobile navigation for Analytics tabs. */
import classNames from 'classnames'
import { FC, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import {
    buildAnalyticsPath,
    campaignsRouteId,
    generalRouteId,
} from '../../../config/routes.config'

import styles from './AnalyticsNav.module.scss'

interface AnalyticsTab {
    id: string
    label: string
}

const ANALYTICS_TABS: AnalyticsTab[] = [
    { id: campaignsRouteId, label: 'Campaigns' },
    { id: generalRouteId, label: 'General' },
]

/**
 * Gets the active Analytics tab from a route pathname.
 *
 * @param pathname current browser pathname.
 * @returns matching tab ID, defaulting to Campaigns.
 * @throws Does not throw.
 */
export function getActiveAnalyticsTab(pathname: string): string {
    return ANALYTICS_TABS.find(tab => (
        pathname === buildAnalyticsPath(tab.id)
        || pathname.startsWith(`${buildAnalyticsPath(tab.id)}/`)
    ))?.id ?? campaignsRouteId
}

/**
 * Renders only the Campaigns and General tabs with a mobile disclosure.
 *
 * @returns responsive Analytics tab navigation.
 * @throws Does not throw.
 */
export const AnalyticsNav: FC = () => {
    const { pathname }: { pathname: string } = useLocation()
    const [isOpen, setIsOpen] = useState(false)
    const activeTab = useMemo(() => getActiveAnalyticsTab(pathname), [pathname])
    const activeLabel = ANALYTICS_TABS.find(tab => tab.id === activeTab)?.label ?? 'Campaigns'

    return (
        <nav className={classNames(styles.navBar, isOpen && styles.open)} aria-label='Analytics sections'>
            <div className={styles.inner}>
                <button
                    aria-expanded={isOpen}
                    className={styles.mobileTrigger}
                    onClick={() => setIsOpen(current => !current)}
                    type='button'
                >
                    <span>{activeLabel}</span>
                    <span aria-hidden='true' className={styles.chevron}>⌄</span>
                </button>
                <ul className={styles.tabs}>
                    {ANALYTICS_TABS.map(tab => {
                        const active = tab.id === activeTab
                        return (
                            <li key={tab.id}>
                                <Link
                                    aria-current={active ? 'page' : undefined}
                                    className={classNames(styles.tab, active && styles.active)}
                                    onClick={() => setIsOpen(false)}
                                    to={buildAnalyticsPath(tab.id)}
                                >
                                    {tab.label}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </nav>
    )
}

export default AnalyticsNav
