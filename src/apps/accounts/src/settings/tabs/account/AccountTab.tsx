import { FC } from 'react'

import { AccountRole } from './account-role'
import styles from './AccountTab.module.scss'

const AccountTab: FC<{}> = () => (
    <div className={styles.container}>
        <h3>ACCOUNT INFORMATION & SECURITY</h3>

        <AccountRole />
    </div>
)

export default AccountTab
