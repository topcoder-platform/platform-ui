import {
    Dispatch,
    FC,
    MouseEvent,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { NavigateFunction, useLocation, useNavigate } from 'react-router-dom'
import classNames from 'classnames'

import { useClickOutside } from '~/libs/shared/lib/hooks'
import { TabsNavItem } from '~/libs/ui'

import { bulkMemberLookupRouteId, reportsPageRouteId } from '../../../config/routes.config'

import styles from './NavTabs.module.scss'

const NavTabs: FC = () => {
    const navigate: NavigateFunction = useNavigate()
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const triggerRef = useRef<HTMLDivElement>(null)
    const { pathname }: { pathname: string } = useLocation()

    const tabs = useMemo<TabsNavItem[]>(() => [
        {
            id: reportsPageRouteId,
            title: 'Reports',
        },
        {
            id: bulkMemberLookupRouteId,
            title: 'Bulk Member Lookup',
        },
    ], [])

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
