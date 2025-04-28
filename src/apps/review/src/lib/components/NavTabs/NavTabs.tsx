import {
    Dispatch,
    FC,
    SetStateAction,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react'
import { NavigateFunction, useLocation, useNavigate } from 'react-router-dom'
import { bind } from 'lodash'
import classNames from 'classnames'

import { useClickOutside } from '~/libs/shared/lib/hooks'

import { getTabIdFromPathName, TabsConfig } from './config'
import styles from './NavTabs.module.scss'

const NavTabs: FC = () => {
    const navigate: NavigateFunction = useNavigate()
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const triggerRef = useRef<HTMLDivElement>(null)
    const { pathname }: { pathname: string } = useLocation()
    const activeTabPathName: string = useMemo<string>(
        () => getTabIdFromPathName(pathname),
        [pathname],
    )
    const [activeTab, setActiveTab]: [
        string,
        Dispatch<SetStateAction<string>>
    ] = useState<string>(activeTabPathName)

    const handleTabChange = useCallback(
        (tabId: string) => {
            setActiveTab(tabId)
            setIsOpen(false)
            navigate(tabId)
        },
        [navigate],
    )

    const triggerTab = useCallback(() => {
        setIsOpen(!isOpen)
    }, [isOpen])

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
                    Review
                </div>
                <ul className={styles.tab}>
                    {TabsConfig.map(tab => (
                        <li
                            key={tab.id}
                            className={
                                tab.id === activeTab ? `${styles.active}` : ''
                            }
                            onClick={bind(handleTabChange, undefined, tab.id)}
                        >
                            {tab.title}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default NavTabs
