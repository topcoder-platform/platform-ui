import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { NavigateFunction, useLocation, useNavigate } from 'react-router-dom'

import { TabsNavbar } from '~/libs/ui'

import { getTabIdFromPathName, SystemAdminTabsConfig } from './config'
import styles from './SystemAdminTabs.module.scss'

const SystemAdminTabs: FC = () => {
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

    // If url is changed by navigator on different tabs, we need set activeTab
    useEffect(() => {
        const pathTabId = getTabIdFromPathName(pathname)
        if (pathTabId !== activeTab) {
            setActiveTab(pathTabId)
        }
    }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className={styles.container}>
            <TabsNavbar
                defaultActive={activeTab}
                tabs={SystemAdminTabsConfig}
                onChange={handleTabChange}
                onChildChange={handleChildTabChange}
            />
        </div>
    )
}

export default SystemAdminTabs
