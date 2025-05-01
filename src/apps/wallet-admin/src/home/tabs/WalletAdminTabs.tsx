import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { UserProfile } from '~/libs/core'
import { PageTitle, TabsNavbar, TabsNavItem } from '~/libs/ui'

import { getHashFromTabId, getTabIdFromHash, WalletAdminTabsConfig, WalletAdminTabViews } from './config'
import { PaymentsTab } from './payments'
import { HomeTab } from './home'
import styles from './WalletAdminTabs.module.scss'

interface WalletHomeProps {
    profile: UserProfile
}

const WalletAdminTabs: FC<WalletHomeProps> = (props: WalletHomeProps) => {
    const { hash }: { hash: string } = useLocation()

    const activeTabHash: string = useMemo<string>(() => getTabIdFromHash(hash), [hash])

    const [activeTab, setActiveTab]: [string, Dispatch<SetStateAction<string>>] = useState<string>(activeTabHash)

    useEffect(() => {
        setActiveTab(activeTabHash)
    }, [activeTabHash])

    function handleTabChange(tabId: string): void {
        setActiveTab(tabId)
        window.location.hash = getHashFromTabId(tabId)
    }

    return (
        <div className={styles.container}>
            <TabsNavbar defaultActive={activeTab} onChange={handleTabChange} tabs={WalletAdminTabsConfig} />

            <PageTitle>
                {[
                    WalletAdminTabsConfig.find((tab: TabsNavItem) => tab.id === activeTab)?.title,
                    'Wallet',
                    'Topcoder',
                ].join(' | ')}
            </PageTitle>

            {activeTab === WalletAdminTabViews.home && <HomeTab profile={props.profile} />}

            {activeTab === WalletAdminTabViews.payments && <PaymentsTab profile={props.profile} />}
        </div>
    )
}

export default WalletAdminTabs
