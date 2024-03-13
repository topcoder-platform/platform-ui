import { FC } from 'react'

import { UserProfile } from '~/libs/core'
import { ContentLayout } from '~/libs/ui'

import { WalletAdminTabs } from '../tabs'

import styles from './WalletAdminLayout.module.scss'

interface WalletHomeLayoutProps {
    profile: UserProfile
}

const WalletAdminLayout: FC<WalletHomeLayoutProps> = (props: WalletHomeLayoutProps) => (
    <ContentLayout outerClass={styles.contentLayoutOuter}>
        <WalletAdminTabs profile={props.profile} />
    </ContentLayout>
)

export default WalletAdminLayout
