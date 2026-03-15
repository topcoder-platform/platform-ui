import { FC } from 'react'

import { UserProfile, UserTraits } from '~/libs/core'

import { UserAndPassword } from './user-and-pass'
import styles from './AccountTab.module.scss'

interface AccountTabProps {
    profile: UserProfile
    memberTraits: UserTraits[] | undefined
}

const AccountTab: FC<AccountTabProps> = (props: AccountTabProps) => (
    <div className={styles.container}>
        <h3>ACCOUNT INFORMATION</h3>
        <UserAndPassword profile={props.profile} memberTraits={props.memberTraits} />
    </div>
)

export default AccountTab
