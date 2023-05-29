import { FC } from 'react'

import { UserProfile } from '~/libs/core'

import { AccountRole } from './account-role'
import styles from './AccountTab.module.scss'

interface AccountTabProps {
    profile: UserProfile
}

const AccountTab: FC<AccountTabProps> = (props: AccountTabProps) => (
    <div className={styles.container}>
        <h3>ACCOUNT INFORMATION & SECURITY</h3>

        <AccountRole profile={props.profile} />
    </div>
)

export default AccountTab
