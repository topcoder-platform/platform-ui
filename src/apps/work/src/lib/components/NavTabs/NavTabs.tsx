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
import { Link, useLocation } from 'react-router-dom'
import classNames from 'classnames'

import { useClickOutside } from '~/libs/shared/lib/hooks'
import { IconOutline } from '~/libs/ui'

import { WorkAppContext } from '../../contexts/WorkAppContext'
import { WorkAppContextModel } from '../../models'

import { getTabIdFromPathName, getTabsConfig } from './config'
import styles from './NavTabs.module.scss'

const NavTabs: FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const triggerRef = useRef<HTMLDivElement>(null)
    const { pathname }: { pathname: string } = useLocation()

    const {
        isAnonymous,
        userRoles,
    }: WorkAppContextModel = useContext(WorkAppContext)

    const tabs = useMemo(
        () => getTabsConfig(userRoles, isAnonymous),
        [userRoles, isAnonymous],
    )

    const activeTabPathName: string = useMemo<string>(
        () => getTabIdFromPathName(pathname, userRoles, isAnonymous),
        [pathname, userRoles, isAnonymous],
    )

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

    const handleTabClick = useCallback(
        (event: MouseEvent<HTMLAnchorElement>) => {
            if (
                event.button !== 0
                || event.altKey
                || event.ctrlKey
                || event.metaKey
                || event.shiftKey
            ) {
                return
            }

            const { tabId }: { tabId?: string } = event.currentTarget.dataset

            if (!tabId) {
                return
            }

            setActiveTab(tabId)
            setIsOpen(false)
        },
        [],
    )

    const handleExternalTabClick = useCallback(() => {
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
                <div className={styles.title} onClick={triggerTab}>
                    Work
                </div>
                <ul className={styles.tab}>
                    {tabs.map(tab => {
                        const isActive = tab.id === activeTab && !tab.url

                        return (
                            <li
                                key={tab.id}
                                className={isActive ? `${styles.active}` : ''}
                            >
                                {tab.url ? (
                                    <a
                                        className={styles.tabLink}
                                        href={tab.url}
                                        onClick={handleExternalTabClick}
                                        rel='noopener noreferrer'
                                        target='_blank'
                                    >
                                        <span className={styles.tabLabel}>{tab.title}</span>
                                        <IconOutline.ExternalLinkIcon
                                            aria-hidden='true'
                                            className={styles.externalIcon}
                                        />
                                    </a>
                                ) : (
                                    <Link
                                        className={styles.tabLink}
                                        data-tab-id={tab.id}
                                        onClick={handleTabClick}
                                        to={tab.id}
                                    >
                                        <span className={styles.tabLabel}>{tab.title}</span>
                                    </Link>
                                )}
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}

export default NavTabs
