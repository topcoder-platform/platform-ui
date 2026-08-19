/**
 * Explains the leaderboard ranking criteria.
 */
import { FC } from 'react'

import { BaseModal } from '~/libs/ui'

import styles from './RankingRulesModal.module.scss'

interface RankingRulesModalProps {
    onClose: () => void
    open: boolean
}

export const RankingRulesModal: FC<RankingRulesModalProps> = props => {
    if (!props.open) {
        return <></>
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='sm'
            title='How rankings are calculated'
        >
            <p>Members are ranked by the following criteria, in order:</p>
            <ol className={styles.rules}>
                <li>Number of wins, highest first</li>
                <li>Number of passing submissions, highest first</li>
                <li>Number of registrations, highest first</li>
                <li>Signup time, earliest first</li>
            </ol>
            <p className={styles.note}>
                At most one submission and one passing submission are counted per member per
                challenge. Every member of the group is listed, including members with no
                challenge activity.
            </p>
        </BaseModal>
    )
}

export default RankingRulesModal
