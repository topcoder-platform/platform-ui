import {
    Dispatch,
    FC,
    KeyboardEvent,
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
import { isEmpty } from 'lodash'
import classNames from 'classnames'

import { useClickOutside } from '~/libs/shared/lib/hooks'
import { IconOutline } from '~/libs/ui'

import { CustomerPortalAppContext } from '../../contexts'
import { CustomerPortalAppContextModel } from '../../models'
import { PRIVILEGED_ROLES } from '../../../config/index.config'
import { rootRoute } from '../../../config/routes.config'

import { getTabIdFromPathName, getTabsConfig } from './config'
import styles from './NavTabs.module.scss'

const NavTabs: FC = () => {
    const navigate: NavigateFunction = useNavigate()
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [openMenuId, setOpenMenuId] = useState<string>()
    const triggerRef = useRef<HTMLDivElement>(null)
    const { pathname }: { pathname: string } = useLocation()

    const { loginUserInfo }: CustomerPortalAppContextModel = useContext(CustomerPortalAppContext)
    const isAnonymous = isEmpty(loginUserInfo)
    const userRoles = useMemo(() => loginUserInfo?.roles || [], [loginUserInfo?.roles])
    const isUnprivilegedUser = useMemo(() => {
        if (!loginUserInfo) return true

        return !userRoles.some(role => PRIVILEGED_ROLES.includes(role))
    }, [loginUserInfo, userRoles])
    const tabs = useMemo(
        () => getTabsConfig(userRoles, isAnonymous, isUnprivilegedUser),
        [userRoles, isAnonymous, isUnprivilegedUser],
    )

    const activeTabPathName: string = useMemo<string>(
        () => getTabIdFromPathName(pathname, userRoles, isAnonymous, isUnprivilegedUser),
        [pathname, userRoles, isAnonymous, isUnprivilegedUser],
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
        setOpenMenuId(undefined)
    }, [isOpen])

    const closeMenus = useCallback(() => {
        setIsOpen(false)
        setOpenMenuId(undefined)
    }, [])

    const navigateToTab = useCallback((tabId: string) => {
        setActiveTab(tabId)
        closeMenus()
        navigate(`${rootRoute}/${tabId}`)
    }, [closeMenus, navigate])

    const handleTabClick = useCallback(
        (event: MouseEvent<HTMLLIElement>) => {
            const {
                tabId,
                tabUrl,
            }: { tabId?: string; tabUrl?: string } = event.currentTarget.dataset

            if (!tabId) {
                return
            }

            if (tabUrl) {
                closeMenus()
                window.open(tabUrl, '_blank', 'noopener,noreferrer')
                return
            }

            navigateToTab(tabId)
        },
        [closeMenus, navigateToTab],
    )

    const toggleMenu = useCallback((event: MouseEvent<HTMLElement>, tabId: string) => {
        event.stopPropagation()
        setOpenMenuId(current => (current === tabId ? undefined : tabId))
    }, [])

    const handleMenuKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Escape') {
            setOpenMenuId(undefined)
        }
    }, [])

    const handleChildClick = useCallback((
        event: MouseEvent<HTMLLIElement>,
        childId: string,
    ) => {
        event.stopPropagation()
        navigateToTab(childId)
    }, [navigateToTab])

    useClickOutside(triggerRef.current, closeMenus)

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
                    Customer Portal
                </div>
                <ul className={styles.tab}>
                    {tabs.map(tab => {
                        const hasChildren = Boolean(tab.children?.length)
                        const isChildActive = tab.children?.some(child => (
                            pathname === `/${child.id}`
                            || pathname.startsWith(`/${child.id}/`)
                        ))
                        const isActive = hasChildren
                            ? Boolean(isChildActive) || tab.id === activeTab
                            : tab.id === activeTab && !tab.url
                        const isMenuOpen = openMenuId === tab.id

                        if (hasChildren) {
                            return (
                                <li
                                    className={classNames(
                                        styles.hasChildren,
                                        isActive && styles.active,
                                        isMenuOpen && styles.menuOpen,
                                    )}
                                    key={tab.id}
                                >
                                    <button
                                        aria-expanded={isMenuOpen}
                                        aria-haspopup='true'
                                        className={styles.menuTrigger}
                                        onClick={function onClick(event: MouseEvent<HTMLButtonElement>) {
                                            toggleMenu(event, tab.id)
                                        }}
                                        onKeyDown={handleMenuKeyDown}
                                        type='button'
                                    >
                                        <span className={styles.tabLabel}>{tab.title}</span>
                                        <IconOutline.ChevronDownIcon
                                            aria-hidden='true'
                                            className={styles.chevron}
                                        />
                                    </button>
                                    <ul className={styles.submenu}>
                                        {tab.children?.map(child => {
                                            const isChildItemActive = pathname === `/${child.id}`
                                                || pathname.startsWith(`/${child.id}/`)

                                            return (
                                                <li
                                                    className={isChildItemActive ? styles.active : ''}
                                                    data-tab-id={child.id}
                                                    key={child.id}
                                                    onClick={function onClick(
                                                        event: MouseEvent<HTMLLIElement>,
                                                    ) {
                                                        handleChildClick(event, child.id)
                                                    }}
                                                >
                                                    {child.title}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </li>
                            )
                        }

                        return (
                            <li
                                key={tab.id}
                                className={isActive ? `${styles.active}` : ''}
                                data-tab-id={tab.id}
                                data-tab-url={tab.url || undefined}
                                onClick={handleTabClick}
                            >
                                <span className={styles.tabLabel}>{tab.title}</span>
                                {tab.url && (
                                    <IconOutline.ExternalLinkIcon
                                        aria-hidden='true'
                                        className={styles.externalIcon}
                                    />
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
