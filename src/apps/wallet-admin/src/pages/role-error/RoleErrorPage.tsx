import { FC } from 'react'

import { ContentLayout } from '~/libs/ui'

import styles from './RoleErrorPage.module.scss'

export const WALLET_ADMIN_ACCESS_DENIED_MESSAGE
    = 'You do not have permission to access the Wallet Admin app.'

const RoleErrorPage: FC = () => (
    <ContentLayout outerClass={styles.contentLayoutOuter}>
        <div className={styles.container}>
            <p className={styles.message}>{WALLET_ADMIN_ACCESS_DENIED_MESSAGE}</p>
        </div>
    </ContentLayout>
)

export default RoleErrorPage
