import { Dispatch, FC, SetStateAction, useState } from 'react'

import { UserProfile } from '~/libs/core'
import { TabsNavbar } from '~/libs/ui'

import { AccountSettingsTabsConfig, AccountSettingsTabViews } from './config'
import { AccountTab } from './account'
import { PreferencesTab } from './preferences'
import styles from './AccountSettingsTabs.module.scss'

interface AccountSettingsTabsProps {
    profile: UserProfile
}

const AccountSettingsTabs: FC<AccountSettingsTabsProps> = (props: AccountSettingsTabsProps) => {
    const [activeTab, setActiveTab]: [string, Dispatch<SetStateAction<string>>]
        = useState<string>(AccountSettingsTabViews.account)

    function handleTabChange(tabId: string): void {
        setActiveTab(tabId)
    }

    return (
        <div className={styles.container}>
            <TabsNavbar
                defaultActive={activeTab}
                onChange={handleTabChange}
                tabs={AccountSettingsTabsConfig}
            />

            {activeTab === AccountSettingsTabViews.account && (
                <AccountTab profile={props.profile} />
            )}

            {activeTab === AccountSettingsTabViews.preferences && (
                <PreferencesTab profile={props.profile} />
            )}
        </div>
    )
}

export default AccountSettingsTabs
