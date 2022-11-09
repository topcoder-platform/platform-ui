import { MemberBadgeAward } from '../../../../../game-lib'

import styles from './MemberAwaredAtRenderer.module.scss'

const MemberAwaredAtRenderer: (memberAward: MemberBadgeAward) => JSX.Element
    = (memberAward: MemberBadgeAward): JSX.Element => {

        const dateFormat: Record<string, string> = {
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            month: 'short',
            year: 'numeric',
        }

        return (
            <div className={styles.memberAwardedAt}>
                {new Date(memberAward.awarded_at).toLocaleString(undefined, dateFormat)}
            </div>
        )
    }

export default MemberAwaredAtRenderer
