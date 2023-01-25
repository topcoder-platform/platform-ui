import { FC } from 'react'

import {
    CertificateBadgeIcon,
    ProvidersLogoList,
    TcaCertificateType,
    TCACertification,
    TCACertificationLearnLevel,
} from '../../learn-lib'

import styles from './HeroTitle.module.scss'

interface HeroTitleProps {
    certTitle: string
    providers: TCACertification['providers']
    certTrack: TcaCertificateType
    certLevel: TCACertificationLearnLevel
}

const HeroTitle: FC<HeroTitleProps> = (props: HeroTitleProps) => (
    <div className={styles.wrap}>
        <CertificateBadgeIcon type={props.certTrack} level={props.certLevel} />
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
