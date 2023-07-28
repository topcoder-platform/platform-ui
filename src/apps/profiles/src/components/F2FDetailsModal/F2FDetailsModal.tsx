/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal } from '~/libs/ui'
import {
    MemberStats,
} from '~/libs/core'

import { numberToFixed } from '../../lib'

import styles from './F2FDetailsModal.module.scss'

type BugHuntViewTypes = 'CHALLENGES DETAILS'

interface F2FDetailsModalProps {
    onClose: () => void
    f2fStats: MemberStats | undefined
}

const F2FDetailsModal: FC<F2FDetailsModalProps> = (props: F2FDetailsModalProps) => {
    // TODO: Add F2F details data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [viewType]: [BugHuntViewTypes, Dispatch<SetStateAction<BugHuntViewTypes>>]
        = useState<BugHuntViewTypes>('CHALLENGES DETAILS')

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='body'
            title='FIRST2FINISH'
        >

            <div className={styles.container}>
                <div className='member-stat-header'>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.f2fStats?.rank.overallPercentile || 0)}
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

                {/* TODO: Add F2F details data */}
                {/* <div className={styles.content}>
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
                </div> */}
            </div>
        </BaseModal>
    )
}

export default F2FDetailsModal
