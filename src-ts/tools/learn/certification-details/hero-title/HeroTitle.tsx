import { FC } from 'react'

import { DevCertBadgeSvg } from '../../learn-lib'
import { ProvidersLogoList } from '../providers-logo-list'

import styles from './HeroTitle.module.scss'

interface HeroTitleProps {
    certTitle: string
    providers: Array<string>
}

const HeroTitle: FC<HeroTitleProps> = (props: HeroTitleProps) => (
    <div className={styles.wrap}>
        <DevCertBadgeSvg />
        <div className={styles.text}>
            <h1 className={styles.title}>
                {props.certTitle}
            </h1>
            <ProvidersLogoList label='Content from' />
        </div>
    </div>
)

export default HeroTitle
