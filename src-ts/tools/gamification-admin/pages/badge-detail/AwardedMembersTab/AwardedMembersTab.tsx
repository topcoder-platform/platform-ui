import { FC } from 'react'

import { GameBadge } from '../../../game-lib'

import styles from './AwardedMembersTab.module.scss'

export interface AwardedMembersTabProps {
    awardedMembers?: GameBadge['member_badges']
}

const AwardedMembersTab: FC<AwardedMembersTabProps> = (props: AwardedMembersTabProps) => {
    return (
        <div className={styles.tabWrap}>

        </div>
    )
}

export default AwardedMembersTab
