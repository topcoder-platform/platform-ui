import { FC } from 'react'
import {
    DSCertBadge1Svg,
    DSCertBadge2Svg,
    DSCertBadge3Svg,
    TCACertificationCategory,
    TCACertificationLearnLevel,
    WebDevCertBadge1Svg,
    WebDevCertBadge2Svg,
    WebDevCertBadge3Svg,
} from '..'
import styles from './TCACertBadge.module.scss'

interface TCACertBadgeProps {
    learnerLevel: TCACertificationLearnLevel
    certificationCategory: TCACertificationCategory
}

const badgesMap: any = {
    DATASCIENCE: {
        Beginner: <DSCertBadge1Svg className={styles.tcaBadge} />,
        Expert: <DSCertBadge3Svg className={styles.tcaBadge} />,
        Intermediate: <DSCertBadge2Svg className={styles.tcaBadge} />,
    },
    DEV: {
        Beginner: <WebDevCertBadge1Svg className={styles.tcaBadge} />,
        Expert: <WebDevCertBadge3Svg className={styles.tcaBadge} />,
        Intermediate: <WebDevCertBadge2Svg className={styles.tcaBadge} />,
    },
}

const TCACertBadge: FC<TCACertBadgeProps>
    = (props: TCACertBadgeProps): JSX.Element => badgesMap[props.certificationCategory.track][props.learnerLevel]

export default TCACertBadge
