/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal } from '~/libs/ui'
import {
    MemberStats,
} from '~/libs/core'

import { numberToFixed } from '../../lib'

import styles from './GenericSubtrackDetailsModal.module.scss'

type GenericViewTypes = 'CHALLENGES DETAILS'

interface GenericSubtrackDetailsModalProps {
    onClose: () => void
    genericStats: MemberStats | undefined
    title: string
}

const GenericSubtrackDetailsModal: FC<GenericSubtrackDetailsModalProps> = (props: GenericSubtrackDetailsModalProps) => {
    // TODO: Enable this when we have challenges details data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [viewType]: [GenericViewTypes, Dispatch<SetStateAction<GenericViewTypes>>]
        = useState<GenericViewTypes>('CHALLENGES DETAILS')

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='body'
            title={props.title}
        >

            <div className={styles.container}>
                <div className='member-stat-header'>
                    <div>
                        <span className='member-stat-value'>{props.genericStats?.wins}</span>
                        Wins
                    </div>
                    <div>
                        <span className='member-stat-value'>{props.genericStats?.challenges}</span>
                        Challenges
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.genericStats?.rank?.overallPercentile || 0)}
                            %
                        </span>
                        Percentile
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.genericStats?.screeningSuccessRate || 0)}
                            %
                        </span>
                        Screening Success Rate
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.genericStats?.avgPlacement || 0)}
                        </span>
                        Average Placement
                    </div>
                </div>

                {/* TODO: Enable this when we have challenges details data */}
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

export default GenericSubtrackDetailsModal