import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { UserProfile } from '~/libs/core'
import { PageTitle, TabsNavbar, TabsNavItem } from '~/libs/ui'

import { getHashFromTabId, getTabIdFromHash, getWalletAdminTabs, WalletAdminTabViews } from './config'
import { DuplicatePaymentsTab } from './duplicate-payments'
import { PaymentsTab } from './payments'
import { HomeTab } from './home'
import styles from './WalletAdminTabs.module.scss'

interface WalletHomeProps {
    profile: UserProfile
}

const WalletAdminTabs: FC<WalletHomeProps> = (props: WalletHomeProps) => {
    const { hash }: { hash: string } = useLocation()

    const tabs: TabsNavItem[] = useMemo(() => getWalletAdminTabs(props.profile.roles), [props.profile.roles])

    // fall back to the dashboard when the hash points to a tab the member can't see
    const activeTabHash: string = useMemo<string>(() => {
        const tabId = getTabIdFromHash(hash)
        return tabs.some(tab => tab.id === tabId) ? tabId : WalletAdminTabViews.home
    }, [hash, tabs])

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
            <TabsNavbar defaultActive={activeTab} onChange={handleTabChange} tabs={tabs} />

            <PageTitle>
                {[
                    tabs.find((tab: TabsNavItem) => tab.id === activeTab)?.title,
                    'Wallet',
                    'Topcoder',
                ].join(' | ')}
            </PageTitle>

            {activeTab === WalletAdminTabViews.home && <HomeTab profile={props.profile} />}

            {activeTab === WalletAdminTabViews.payments && <PaymentsTab profile={props.profile} />}

            {activeTab === WalletAdminTabViews.duplicatePayments && <DuplicatePaymentsTab />}
        </div>
    )
}

export default WalletAdminTabs
