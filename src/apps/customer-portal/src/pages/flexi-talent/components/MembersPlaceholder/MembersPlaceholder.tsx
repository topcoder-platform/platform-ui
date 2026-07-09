import { FC } from 'react'

import styles from '../../FlexiTalentPage/FlexiTalentPage.module.scss'

/**
 * Members inner-view placeholder.
 *
 * This keeps the Flexi-Talent switcher contract mounted without calling member
 * summary, list, detail, or history endpoints before the follow-up ticket.
 */
export const MembersPlaceholder: FC = () => (
    <div className={styles.membersPlaceholder}>
        <div className={styles.placeholderPane}>
            <p className={styles.placeholderEyebrow}>Members</p>
            <h3 className={styles.placeholderTitle}>Member tracking is coming next.</h3>
            <p className={styles.placeholderText}>
                The shell is ready for the member summary, list, detail, and history views.
            </p>
        </div>
    </div>
)

export default MembersPlaceholder
