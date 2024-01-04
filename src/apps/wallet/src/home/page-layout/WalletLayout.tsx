import { FC } from 'react'

import { UserProfile } from '~/libs/core'
import { ContentLayout } from '~/libs/ui'

import { WalletTabs } from '../tabs'

import styles from './WalletLayout.module.scss'

interface WalletHomeLayoutProps {
    profile: UserProfile
}

const WalletLayout: FC<WalletHomeLayoutProps> = (props: WalletHomeLayoutProps) => (
    <ContentLayout outerClass={styles.contentLayoutOuter}>
        <WalletTabs profile={props.profile} />
    </ContentLayout>
)

export default WalletLayout
