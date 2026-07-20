/* eslint-disable react/jsx-no-bind */
/**
 * URL-driven desktop and mobile navigation for Status tabs.
 */
import { FC, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import classNames from 'classnames'

import {
    apiRouteId,
    buildStatusPath,
    databaseRouteId,
    ecsRouteId,
    sendgridRouteId,
} from '../../../config/routes.config'

import styles from './NavTabs.module.scss'

interface StatusTab {
    id: string
    label: string
}

const STATUS_TABS: StatusTab[] = [
    { id: ecsRouteId, label: 'ECS' },
    { id: apiRouteId, label: 'API' },
    { id: sendgridRouteId, label: 'SendGrid' },
    { id: databaseRouteId, label: 'Database' },
]

/**
 * Gets the active top-level tab from a Status route pathname.
 *
 * @param pathname current browser pathname.
 * @returns the matching tab ID, defaulting to ECS.
 * @throws Does not throw.
 */
export function getActiveStatusTab(pathname: string): string {
    const matchingTab = STATUS_TABS.find(tab => (
        pathname === buildStatusPath(tab.id)
        || pathname.startsWith(`${buildStatusPath(tab.id)}/`)
    ))

    return matchingTab?.id ?? ecsRouteId
}

/**
 * Renders always-visible administrator Status tabs and an accessible mobile disclosure.
 *
 * @returns responsive Status navigation.
 * @throws Does not throw.
 */
export const NavTabs: FC = () => {
    const { pathname }: { pathname: string } = useLocation()
    const [isOpen, setIsOpen] = useState(false)
    const activeTab = useMemo(() => getActiveStatusTab(pathname), [pathname])
    const activeLabel = STATUS_TABS.find(tab => tab.id === activeTab)?.label ?? 'ECS'

    return (
        <nav className={classNames(styles.navBar, isOpen && styles.open)} aria-label='Status sections'>
            <div className={styles.inner}>
                <button
                    aria-expanded={isOpen}
                    className={styles.mobileTrigger}
                    onClick={() => setIsOpen(current => !current)}
                    type='button'
                >
                    <span>
                        Status ·
                        {' '}
                        {activeLabel}
                    </span>
                    <span aria-hidden='true' className={styles.chevron}>⌄</span>
                </button>
                <div className={styles.title}>Status</div>
                <ul className={styles.tabs}>
                    {STATUS_TABS.map(tab => {
                        const active = tab.id === activeTab
                        return (
                            <li key={tab.id}>
                                <Link
                                    aria-current={active ? 'page' : undefined}
                                    className={classNames(styles.tab, active && styles.active)}
                                    onClick={() => setIsOpen(false)}
                                    to={buildStatusPath(tab.id)}
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

export default NavTabs
