import { FC } from 'react'

import { GameBadge } from '../../../game-lib'

import styles from './AwardedMembersTab.module.scss'

export interface AwardedMembersTabProps {
    badge: GameBadge
}

const AwardedMembersTab: FC<AwardedMembersTabProps> = (props: AwardedMembersTabProps) => {
    return (
        <div className={styles.tabWrap}>

        </div>
    )
}

export default AwardedMembersTab
