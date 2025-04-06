import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
import { NavigateFunction, useLocation, useNavigate } from 'react-router-dom'

import { TabsNavbar } from '~/libs/ui'

import { getTabIdFromPathName, TabsConfig } from './config'
import styles from './NavTabs.module.scss'

const NavTabs: FC = () => {
    const navigate: NavigateFunction = useNavigate()

    const { pathname }: { pathname: string } = useLocation()
    const activeTabPathName: string = useMemo<string>(() => getTabIdFromPathName(pathname), [pathname])
    const [activeTab, setActiveTab]: [string, Dispatch<SetStateAction<string>>]
        = useState<string>(activeTabPathName)

    function handleTabChange(tabId: string): void {
        setActiveTab(tabId)
        navigate(tabId)
    }

    function handleChildTabChange(tabId: string, childTabId: string): void {
        setActiveTab(tabId)
        navigate(childTabId)
    }

    return (
        <div className={styles.container}>
            <TabsNavbar
                defaultActive={activeTab}
                tabs={TabsConfig}
                onChange={handleTabChange}
                onChildChange={handleChildTabChange}
            />
        </div>
    )
}

export default NavTabs
