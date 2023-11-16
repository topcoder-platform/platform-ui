import { FC } from 'react'

import { MemberStats, SRMStats } from '~/libs/core'

import styles from './SRMView.module.scss'

interface SRMViewProps {
    trackData: SRMStats | MemberStats
}

const SRMView: FC<SRMViewProps> = props => {
    return (
        <div className={styles.wrap}>
        </div>
    )
}

export default SRMView
