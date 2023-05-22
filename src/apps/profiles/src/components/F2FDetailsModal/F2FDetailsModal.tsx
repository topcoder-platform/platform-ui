/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal } from '~/libs/ui'
import {
    MemberStats,
} from '~/libs/core'

import styles from './F2FDetailsModal.module.scss'

type BugHuntViewTypes = 'CHALLENGES DETAILS'

interface F2FDetailsModalProps {
    isF2FDetailsOpen: boolean
    onClose: () => void
    f2fStats: MemberStats | undefined
}

const F2FDetailsModal: FC<F2FDetailsModalProps> = (props: F2FDetailsModalProps) => {
    const [viewType]: [BugHuntViewTypes, Dispatch<SetStateAction<BugHuntViewTypes>>]
        = useState<BugHuntViewTypes>('CHALLENGES DETAILS')

    return (
        <BaseModal
            onClose={props.onClose}
            open={props.isF2FDetailsOpen}
            size='body'
            title='FIRST2FINISH'
        >

            <div className={styles.container}>
                <div className='member-stat-header'>
                    <div>
                        <span className='member-stat-value'>
                            {Number(props.f2fStats?.rank.overallPercentile || 0)
                                .toFixed(2)}
                            %
                        </span>
                        Percentile
                    </div>
                    <div>
                        <span className='member-stat-value'>{props.f2fStats?.wins}</span>
                        Wins
                    </div>
                    <div>
                        <span className='member-stat-value'>{props.f2fStats?.challenges}</span>
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

export default F2FDetailsModal