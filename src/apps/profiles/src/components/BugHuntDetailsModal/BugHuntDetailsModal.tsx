/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal } from '~/libs/ui'
import {
    MemberStats,
} from '~/libs/core'

import styles from './BugHuntDetailsModal.module.scss'

type BugHuntViewTypes = 'CHALLENGES DETAILS'

interface BugHuntDetailsModalProps {
    isBugHuntDetailsOpen: boolean
    onClose: () => void
    bugHuntStats: MemberStats | undefined
}

const BugHuntDetailsModal: FC<BugHuntDetailsModalProps> = (props: BugHuntDetailsModalProps) => {
    const [viewType]: [BugHuntViewTypes, Dispatch<SetStateAction<BugHuntViewTypes>>]
        = useState<BugHuntViewTypes>('CHALLENGES DETAILS')

    return (
        <BaseModal
            onClose={props.onClose}
            open={props.isBugHuntDetailsOpen}
            size='body'
            title='BUG HUNT'
        >

            <div className={styles.container}>
                <div className='member-stat-header'>
                    <div>
                        <span className='member-stat-value'>
                            {Number(props.bugHuntStats?.rank.overallPercentile || 0)
                                .toFixed(2)}
                            %
                        </span>
                        Percentile
                    </div>
                    <div>
                        <span className='member-stat-value'>{props.bugHuntStats?.wins}</span>
                        Wins
                    </div>
                    <div>
                        <span className='member-stat-value'>{props.bugHuntStats?.challenges}</span>
                        Challenges
                    </div>
                </div>

                <div className={styles.content}>
                    <div className={styles.contentHeader}>
                        <h4>{viewType}</h4>
                    </div>

                    <div className={styles.contentBody}>
                        {
                            viewType === 'CHALLENGES DETAILS' && (
                                <div />
                            )

                        }
                    </div>
                </div>
            </div>
        </BaseModal>
    )
}

export default BugHuntDetailsModal