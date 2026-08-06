import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { NavigateFunction, useLocation, useNavigate } from 'react-router-dom'

import { ProfileContextData, useProfileContext } from '~/libs/core'
import { TabsNavbar } from '~/libs/ui'

import { rootRoute } from '../../../../config/routes.config'

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
        navigate(`${rootRoute}/${tabId}`)
    }

    function handleChildTabChange(tabId: string, childTabId: string): void {
        setActiveTab(tabId)
        navigate(`${rootRoute}/${childTabId}`)
    }

    // Keep browser navigation in sync without reacting to the optimistic click state.
    useEffect(() => {
        setActiveTab(activeTabPathName)
    }, [activeTabPathName])

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
