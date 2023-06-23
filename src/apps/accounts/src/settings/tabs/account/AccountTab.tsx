import { FC } from 'react'

import { UserProfile, UserTraits } from '~/libs/core'

import { AccountRole } from './account-role'
import { SecuritySection } from './security'
import { UserAndPassword } from './user-and-pass'
import styles from './AccountTab.module.scss'

interface AccountTabProps {
    profile: UserProfile
    memberTraits: UserTraits[] | undefined
}

const AccountTab: FC<AccountTabProps> = (props: AccountTabProps) => (
    <div className={styles.container}>
        <h3>ACCOUNT INFORMATION & SECURITY</h3>

        <AccountRole profile={props.profile} />

        <UserAndPassword profile={props.profile} memberTraits={props.memberTraits} />

        <SecuritySection profile={props.profile} />
    </div>
)

export default AccountTab
