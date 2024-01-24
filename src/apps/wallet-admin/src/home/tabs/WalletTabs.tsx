import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { UserProfile } from '~/libs/core'
import { PageTitle, TabsNavbar, TabsNavItem } from '~/libs/ui'

import { getHashFromTabId, getTabIdFromHash, WalletAdminTabsConfig, WalletTabViews } from './config'
import { PaymentsTab } from './payments'
import { WinningsTab } from './winnings'
import { TaxFormsTab } from './tax-forms'
import styles from './WalletTabs.module.scss'

interface WalletHomeProps {
    profile: UserProfile
}

const WalletTabs: FC<WalletHomeProps> = (props: WalletHomeProps) => {
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
                    WalletAdminTabsConfig.find(
                        (tab: TabsNavItem) => tab.id === activeTab,
                    )?.title,
                    'Wallet Admin', 'Topcoder'].join(' | ')}
            </PageTitle>

            {activeTab === WalletTabViews.withdrawalmethods && <PaymentsTab />}

            {activeTab === WalletTabViews.winnings && <WinningsTab profile={props.profile} />}

            {activeTab === WalletTabViews.taxforms && <TaxFormsTab profile={props.profile} />}
        </div>
    )
}

export default WalletTabs
