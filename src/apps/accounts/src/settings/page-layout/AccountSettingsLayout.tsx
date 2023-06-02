import { FC } from 'react'

import { UserProfile } from '~/libs/core'
import { ContentLayout } from '~/libs/ui'

import { AccountSettingsTabs } from '../tabs'

import styles from './AccountSettingsLayout.module.scss'

interface AccountSettingsLayoutProps {
    profile: UserProfile
}

const AccountSettingsLayout: FC<AccountSettingsLayoutProps> = (props: AccountSettingsLayoutProps) => (
    <ContentLayout
        outerClass={styles.contentLayoutOuter}
    >
        <AccountSettingsTabs
            profile={props.profile}
        />
    </ContentLayout>
)

export default AccountSettingsLayout
