import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { useMemberTraits, UserProfile, UserTraits } from '~/libs/core'
import { PageTitle, TabsNavbar, TabsNavItem } from '~/libs/ui'

import { AccountSettingsTabsConfig, AccountSettingsTabViews, getHashFromTabId, getTabIdFromHash } from './config'
import { AccountTab } from './account'
import { PreferencesTab } from './preferences'
import { PaymentsTab } from './payments'
import { ToolsTab } from './tools'
import { TCandYouTab } from './tcandyou'
import styles from './AccountSettingsTabs.module.scss'

interface AccountSettingsTabsProps {
    profile: UserProfile
}

const AccountSettingsTabs: FC<AccountSettingsTabsProps> = (props: AccountSettingsTabsProps) => {
    const { hash }: { hash: string } = useLocation()

    const activeTabHash: string = useMemo<string>(() => getTabIdFromHash(hash), [hash])

    const [activeTab, setActiveTab]: [string, Dispatch<SetStateAction<string>>]
        = useState<string>(activeTabHash)

    const memberTraits: UserTraits[] | undefined = useMemberTraits(props.profile.handle)

    function handleTabChange(tabId: string): void {
        setActiveTab(tabId)
        window.location.hash = getHashFromTabId(tabId)
    }

    return (
        <div className={styles.container}>
            <TabsNavbar
                defaultActive={activeTab}
                onChange={handleTabChange}
                tabs={AccountSettingsTabsConfig}
            />

            <PageTitle>
                {[
                    AccountSettingsTabsConfig.find((tab: TabsNavItem) => tab.id === activeTab)?.title,
                    'Account Settings',
                    'Topcoder'].join(' | ')}
            </PageTitle>

            {activeTab === AccountSettingsTabViews.tcandyou && (
                <TCandYouTab profile={props.profile} memberTraits={memberTraits} />
            )}

            {activeTab === AccountSettingsTabViews.tools && (
                <ToolsTab profile={props.profile} memberTraits={memberTraits} />
            )}

            {activeTab === AccountSettingsTabViews.account && (
                <AccountTab profile={props.profile} memberTraits={memberTraits} />
            )}

            {activeTab === AccountSettingsTabViews.preferences && (
                <PreferencesTab profile={props.profile} />
            )}

            {activeTab === AccountSettingsTabViews.payment && (
                <PaymentsTab profile={props.profile} />
            )}
        </div>
    )
}

export default AccountSettingsTabs
