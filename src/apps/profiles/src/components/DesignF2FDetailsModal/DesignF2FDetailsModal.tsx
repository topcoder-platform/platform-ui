/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal } from '~/libs/ui'
import {
    MemberStats,
} from '~/libs/core'

import { numberToFixed } from '../../lib'

import styles from './DesignF2FDetailsModal.module.scss'

type WebDesignViewTypes = 'CHALLENGES DETAILS'

interface DesignF2FDetailsModalProps {
    isDesignF2FDetailsOpen: boolean
    onClose: () => void
    designF2FStats: MemberStats | undefined
}

const DesignF2FDetailsModal: FC<DesignF2FDetailsModalProps> = (props: DesignF2FDetailsModalProps) => {
    const [viewType]: [WebDesignViewTypes, Dispatch<SetStateAction<WebDesignViewTypes>>]
        = useState<WebDesignViewTypes>('CHALLENGES DETAILS')

    return (
        <BaseModal
            onClose={props.onClose}
            open={props.isDesignF2FDetailsOpen}
            size='body'
            title='DESIGN FIRST2FINISH'
        >

            <div className={styles.container}>
                <div className='member-stat-header'>
                    <div>
                        <span className='member-stat-value'>{props.designF2FStats?.wins}</span>
                        Wins
                    </div>
                    <div>
                        <span className='member-stat-value'>{props.designF2FStats?.challenges}</span>
                        Challenges
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.designF2FStats?.rank?.overallPercentile || 0)}
                            %
                        </span>
                        Percentile
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.designF2FStats?.screeningSuccessRate || 0)}
                            %
                        </span>
                        Screening Success Rate
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.designF2FStats?.avgPlacement || 0)}
                        </span>
                        Average Placement
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

export default DesignF2FDetailsModal
