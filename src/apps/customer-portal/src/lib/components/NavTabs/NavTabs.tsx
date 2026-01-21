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
import { isEmpty } from 'lodash'
import classNames from 'classnames'

import { useClickOutside } from '~/libs/shared/lib/hooks'
import { IconOutline } from '~/libs/ui'

import { CustomerPortalAppContext } from '../../contexts'
import { CustomerPortalAppContextModel } from '../../models'
import { PRIVILEGED_ROLES } from '../../../config/index.config'

import { getTabIdFromPathName, getTabsConfig } from './config'
import styles from './NavTabs.module.scss'

const NavTabs: FC = () => {
    const navigate: NavigateFunction = useNavigate()
    const [isOpen, setIsOpen] = useState<boolean>(false)
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
    }, [isOpen])

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
                setIsOpen(false)
                window.open(tabUrl, '_blank', 'noopener,noreferrer')
                return
            }

            setActiveTab(tabId)
            setIsOpen(false)
            navigate(tabId)
        },
        [navigate],
    )

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
                    Customer Portal
                </div>
                <ul className={styles.tab}>
                    {tabs.map(tab => {
                        const isActive = tab.id === activeTab && !tab.url

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
