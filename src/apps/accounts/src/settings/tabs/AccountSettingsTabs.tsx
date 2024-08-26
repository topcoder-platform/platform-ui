import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { KeyedMutator } from 'swr'

import { EnvironmentConfig } from '~/config'
import { useMemberTraits, UserProfile, UserTraits } from '~/libs/core'
import { PageTitle, TabsNavbar, TabsNavItem } from '~/libs/ui'

import { AccountSettingsTabsConfig, AccountSettingsTabViews, getHashFromTabId, getTabIdFromHash } from './config'
import { AccountTab } from './account'
import { PreferencesTab } from './preferences'
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

    const { data: memberTraits, mutate: mutateTraits }: {
        data: UserTraits[] | undefined,
        mutate: KeyedMutator<any>
    } = useMemberTraits(props.profile.handle)

    function handleTabChange(tabId: string): void {
        if (tabId === AccountSettingsTabViews.payment) {
            window.location.href = `https://wallet.${EnvironmentConfig.TC_DOMAIN}`
        } else {
            setActiveTab(tabId)
            window.location.hash = getHashFromTabId(tabId)
            mutateTraits() // mutate member traits to refresh the data
        }
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
        </div>
    )
}

export default AccountSettingsTabs
