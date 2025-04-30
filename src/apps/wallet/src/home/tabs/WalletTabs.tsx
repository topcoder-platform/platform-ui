import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { UserProfile } from '~/libs/core'
import { PageTitle, TabsNavbar, TabsNavItem } from '~/libs/ui'

import { getHashFromTabId, getTabIdFromHash, WalletTabsConfig, WalletTabViews } from './config'
import { WinningsTab } from './winnings'
import { HomeTab } from './home'
import { PayoutTab } from './payout'
import styles from './WalletTabs.module.scss'

interface WalletHomeProps {
    profile: UserProfile
}

const WalletTabs: FC<WalletHomeProps> = (props: WalletHomeProps) => {
    const { hash }: { hash: string } = useLocation()

    const activeTabHash: WalletTabViews = useMemo<WalletTabViews>(() => getTabIdFromHash(hash), [hash])

    const [activeTab, setActiveTab]: [WalletTabViews, Dispatch<SetStateAction<WalletTabViews>>]
        = useState<WalletTabViews>(activeTabHash)

    useEffect(() => {
        setActiveTab(activeTabHash)
    }, [activeTabHash])

    function handleTabChange(tabId: WalletTabViews): void {
        setActiveTab(tabId)
        window.location.hash = getHashFromTabId(tabId)
    }

    return (
        <div className={styles.container}>
            <TabsNavbar defaultActive={activeTab} onChange={handleTabChange} tabs={WalletTabsConfig} />

            <PageTitle>
                {[
                    WalletTabsConfig.find((tab: TabsNavItem<WalletTabViews>) => tab.id === activeTab)?.title,
                    'Wallet',
                    'Topcoder',
                ].join(' | ')}
            </PageTitle>

            {activeTab === WalletTabViews.winnings && <WinningsTab profile={props.profile} />}

            {activeTab === WalletTabViews.home && <HomeTab profile={props.profile} />}

            {activeTab === WalletTabViews.payout && <PayoutTab profile={props.profile} />}
        </div>
    )
}

export default WalletTabs
