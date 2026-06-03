import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { NavigateFunction, useLocation, useNavigate } from 'react-router-dom'

import { ProfileContextData, useProfileContext } from '~/libs/core'
import { TabsNavbar } from '~/libs/ui'

import { getSystemAdminTabs, getTabIdFromPathName } from './config'
import styles from './SystemAdminTabs.module.scss'

const SystemAdminTabs: FC = () => {
    const navigate: NavigateFunction = useNavigate()
    const { profile }: ProfileContextData = useProfileContext()

    const { pathname }: { pathname: string } = useLocation()
    const tabs = useMemo(() => getSystemAdminTabs(profile?.roles), [profile?.roles])
    const activeTabPathName: string = useMemo<string>(
        () => getTabIdFromPathName(pathname, tabs),
        [pathname, tabs],
    )
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
        const pathTabId = getTabIdFromPathName(pathname, tabs)
        if (pathTabId !== activeTab) {
            setActiveTab(pathTabId)
        }
    }, [activeTab, pathname, tabs])

    if (!tabs.length) {
        return <></>
    }

    return (
        <div className={styles.container}>
            <TabsNavbar
                defaultActive={activeTab}
                tabs={tabs}
                onChange={handleTabChange}
                onChildChange={handleChildTabChange}
            />
        </div>
    )
}

export default SystemAdminTabs
