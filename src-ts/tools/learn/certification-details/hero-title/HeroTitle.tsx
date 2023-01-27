import { FC } from 'react'

import { TCACertBadge, TCACertification } from '../../learn-lib'
import { ProvidersLogoList } from '../../learn-lib/providers-logo-list'

import styles from './HeroTitle.module.scss'

interface HeroTitleProps {
    certification: TCACertification
    certTitle: string
}

const HeroTitle: FC<HeroTitleProps> = (props: HeroTitleProps) => (
    <div className={styles.wrap}>
        <TCACertBadge
            learnerLevel={props.certification.learnerLevel}
            certificationCategory={props.certification.certificationCategory}
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
