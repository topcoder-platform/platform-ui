/* eslint-disable react/jsx-wrap-multilines */
import { FC, useEffect, useState } from 'react'

import { UserProfile } from '~/libs/core'
import { IconOutline, LinkButton, LoadingCircles } from '~/libs/ui'

import { Balance, WalletDetails } from '../../../lib/models/WalletDetails'
import { getWalletDetails } from '../../../lib/services/wallet'
import { InfoRow } from '../../../lib'
import { BannerImage, BannerText } from '../../../lib/assets/home'
import Chip from '../../../lib/components/chip/Chip'

import styles from './Home.module.scss'

interface HomeTabProps {
    profile: UserProfile
}

const HomeTab: FC<HomeTabProps> = () => (
    <div className={styles.container}>
        <div className={styles.banner}>
            <BannerText />
            <BannerImage />
        </div>
    </div>
)

export default HomeTab
