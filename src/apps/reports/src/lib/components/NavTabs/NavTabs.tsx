import {
    Dispatch,
    FC,
    MouseEvent,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { NavigateFunction, useLocation, useNavigate } from 'react-router-dom'
import classNames from 'classnames'

import { useClickOutside } from '~/libs/shared/lib/hooks'
import { TabsNavItem } from '~/libs/ui'
import { UserRole } from '~/libs/core'

import {
    billingAccountsPageRouteId,
    bulkMemberLookupRouteId,
    reportsPageRouteId,
    talentPageRouteId,
} from '../../../config/routes.config'
import { ReportsAppContext, ReportsAppContextModel } from '../../contexts'

import styles from './NavTabs.module.scss'

const NavTabs: FC = () => {
    const navigate: NavigateFunction = useNavigate()
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const triggerRef = useRef<HTMLDivElement>(null)
    const { pathname }: { pathname: string } = useLocation()
    const { loginUserInfo }: ReportsAppContextModel = useContext(ReportsAppContext)
    const isAdministrator = useMemo(() => (
        !!loginUserInfo?.roles?.some(role => role.toLowerCase() === UserRole.administrator)
    ), [loginUserInfo])

    const tabs = useMemo<TabsNavItem[]>(() => {
        const baseTabs: TabsNavItem[] = [
            {
                id: reportsPageRouteId,
                title: 'Reports',
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

        return isAdministrator
            ? [
                ...baseTabs,
                {
                    id: talentPageRouteId,
                    title: 'Talent',
                },
            ]
            : baseTabs
    }, [isAdministrator])

    const activeTabPathName: string = useMemo<string>(() => {
        const matchingTabs = tabs
            .filter(tab => pathname.includes(`/${tab.id}`))
            .sort((tabA, tabB) => tabB.id.length - tabA.id.length)

        if (matchingTabs.length > 0) {
            return matchingTabs[0].id as string
        }

        return reportsPageRouteId
    }, [pathname, tabs])

    const [activeTab, setActiveTab]: [
        string,
        Dispatch<SetStateAction<string>>
    ] = useState<string>(activeTabPathName)

    useEffect(() => {
        setActiveTab(activeTabPathName)
    }, [activeTabPathName])

    const triggerTab = useCallback(() => {
        setIsOpen(!isOpen)
    }, [isOpen])

    const handleTabClick = useCallback((event: MouseEvent<HTMLLIElement>) => {
        const { tabId }: { tabId?: string } = event.currentTarget.dataset

        if (!tabId) {
            return
        }

        setActiveTab(tabId)
        setIsOpen(false)
        navigate(tabId)
    }, [navigate])

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
                <div className={styles.title} onClick={triggerTab}>
                    Reports
                </div>
                <ul className={styles.tab}>
                    {tabs.map(tab => {
                        const isActive = tab.id === activeTab

                        return (
                            <li
                                key={`${tab.id}`}
                                className={isActive ? `${styles.active}` : ''}
                                data-tab-id={tab.id}
                                onClick={handleTabClick}
                            >
                                <span className={styles.tabLabel}>{tab.title}</span>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}

export default NavTabs
