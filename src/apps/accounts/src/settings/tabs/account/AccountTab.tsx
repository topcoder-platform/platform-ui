import { FC } from 'react'

import { UserProfile, UserTraits } from '~/libs/core'

import { AccountRole } from './account-role'
import { UserAndPassword } from './user-and-pass'
import { MemberAddress } from './address'
import styles from './AccountTab.module.scss'

interface AccountTabProps {
    profile: UserProfile
    memberTraits: UserTraits[] | undefined
}

const AccountTab: FC<AccountTabProps> = (props: AccountTabProps) => (
    <div className={styles.container}>
        <h3>ACCOUNT INFORMATION</h3>

        <AccountRole profile={props.profile} />

        <UserAndPassword profile={props.profile} memberTraits={props.memberTraits} />

        <MemberAddress profile={props.profile} />
    </div>
)

export default AccountTab
