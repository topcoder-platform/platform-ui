import {
    FC,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Link, useLocation } from 'react-router-dom'
import classNames from 'classnames'

import { useClickOutside } from '~/libs/shared/lib/hooks'
import type { TabsNavItem } from '~/libs/ui'

import {
    billingAccountsPageRouteId,
    buildReportsPath,
    bulkMemberLookupRouteId,
    dashboardsPageRouteId,
    reportsPageRouteId,
    talentPageRouteId,
} from '../../../config/routes.config'
import {
    ReportsAppContext,
    ReportsAppContextModel,
} from '../../contexts/ReportsAppContext'
import { canAccessTalentReport } from '../../utils'

import styles from './NavTabs.module.scss'

const NavTabs: FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const triggerRef = useRef<HTMLDivElement>(null)
    const { pathname }: { pathname: string } = useLocation()
    const { loginUserInfo }: ReportsAppContextModel = useContext(ReportsAppContext)
    const canAccessTalent = useMemo(() => (
        canAccessTalentReport(loginUserInfo?.roles)
    ), [loginUserInfo])

    const tabs = useMemo<TabsNavItem[]>(() => {
        const baseTabs: TabsNavItem[] = [
            {
                id: reportsPageRouteId,
                title: 'Reports',
            },
            {
                id: dashboardsPageRouteId,
                title: 'Dashboards',
            },
            {
                id: bulkMemberLookupRouteId,
                title: 'Bulk Member Lookup',
            },
            {
                id: billingAccountsPageRouteId,
                title: 'SFDC Payments',
            },
        ]

        return canAccessTalent
            ? [
                ...baseTabs,
                {
                    id: talentPageRouteId,
                    title: 'Talent',
                },
            ]
            : baseTabs
    }, [canAccessTalent])

    const activeTabPathName: string = useMemo<string>(() => {
        const matchingTabs = tabs
            .filter(tab => {
                const tabPath = buildReportsPath(tab.id)
                return pathname === tabPath || pathname.startsWith(`${tabPath}/`)
            })
            .sort((tabA, tabB) => (
                buildReportsPath(tabB.id).length - buildReportsPath(tabA.id).length
            ))

        if (matchingTabs.length > 0) {
            return matchingTabs[0].id as string
        }

        return reportsPageRouteId
    }, [pathname, tabs])

    const triggerTab = useCallback(() => {
        setIsOpen(!isOpen)
    }, [isOpen])

    const handleTabClick = useCallback(() => {
        setIsOpen(false)
    }, [])

    useClickOutside(triggerRef.current, () => setIsOpen(false))

    return (
        <div
            className={classNames(
                styles['nav-bar'],
                isOpen ? styles.open : '',
            )}
            ref={triggerRef}
        >
            <div className={styles.inner}>
                <button
                    aria-controls='reports-navigation-tabs'
                    aria-expanded={isOpen}
                    className={styles.title}
                    onClick={triggerTab}
                    type='button'
                >
                    Reports
                </button>
                <ul className={styles.tab} id='reports-navigation-tabs'>
                    {tabs.map(tab => {
                        const isActive = tab.id === activeTabPathName

                        return (
                            <li
                                key={`${tab.id}`}
                                className={isActive ? `${styles.active}` : ''}
                            >
                                <Link
                                    aria-current={isActive ? 'page' : undefined}
                                    className={styles.tabLink}
                                    onClick={handleTabClick}
                                    to={buildReportsPath(tab.id)}
                                >
                                    <span className={styles.tabLabel}>{tab.title}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}

export default NavTabs
