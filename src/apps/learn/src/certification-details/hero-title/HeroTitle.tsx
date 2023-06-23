import { FC } from 'react'

import {
    CertificateBadgeIcon,
    ProvidersLogoList,
    TCACertification,
} from '../../lib'

import styles from './HeroTitle.module.scss'

interface HeroTitleProps {
    certification: TCACertification
    certTitle: string
}

const HeroTitle: FC<HeroTitleProps> = (props: HeroTitleProps) => (
    <div className={styles.wrap}>
        <CertificateBadgeIcon
            type={props.certification.certificationCategory.track}
            level={props.certification.learnerLevel}
        />
        <div className={styles.text}>
            <h1 className={styles.title}>
                {props.certTitle}
            </h1>
            <ProvidersLogoList
                label='Content from'
                providers={props.certification.providers}
            />
        </div>
    </div>
)

export default HeroTitle
