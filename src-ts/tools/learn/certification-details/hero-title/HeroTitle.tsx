import { FC } from 'react'

import { CertificateBadgeIcon, TCACertification } from '../../learn-lib'
import { ProvidersLogoList } from '../providers-logo-list'

import styles from './HeroTitle.module.scss'

interface HeroTitleProps {
    certTitle: string
    providers: TCACertification['providers']
}

const HeroTitle: FC<HeroTitleProps> = (props: HeroTitleProps) => (
    <div className={styles.wrap}>
        <CertificateBadgeIcon type='DEV' level='Beginner' />
        <div className={styles.text}>
            <h1 className={styles.title}>
                {props.certTitle}
            </h1>
            <ProvidersLogoList
                label='Content from'
                providers={props.providers}
            />
        </div>
    </div>
)

export default HeroTitle
