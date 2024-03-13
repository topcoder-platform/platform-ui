/* eslint-disable react/jsx-wrap-multilines */
import { FC } from 'react'

import { UserProfile } from '~/libs/core'

import { BannerImage, BannerText } from '../../../lib/assets/home'

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
