import { FC } from 'react'

import { Collapsible } from '~/libs/ui'

import styles from './AccountRole.module.scss'

const AccountRole: FC<{}> = () => (
    <Collapsible
        header={<h3>Account Role</h3>}
        containerClass={styles.container}
    />
)

export default AccountRole
