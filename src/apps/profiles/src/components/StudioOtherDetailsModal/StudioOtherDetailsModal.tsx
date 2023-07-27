/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal } from '~/libs/ui'
import {
    MemberStats,
} from '~/libs/core'

import { numberToFixed } from '../../lib'

import styles from './StudioOtherDetailsModal.module.scss'

type WebDesignViewTypes = 'CHALLENGES DETAILS'

interface StudioOtherDetailsModalProps {
    onClose: () => void
    studioOtherStats: MemberStats | undefined
}

const StudioOtherDetailsModal: FC<StudioOtherDetailsModalProps>
    = (props: StudioOtherDetailsModalProps) => {
        // TODO: Enable this when we have challenges details data
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [viewType]: [WebDesignViewTypes, Dispatch<SetStateAction<WebDesignViewTypes>>]
            = useState<WebDesignViewTypes>('CHALLENGES DETAILS')

        return (
            <BaseModal
                onClose={props.onClose}
                open
                size='body'
                title='Studio Other'
            >

                <div className={styles.container}>
                    <div className='member-stat-header'>
                        <div>
                            <span className='member-stat-value'>{props.studioOtherStats?.wins}</span>
                            Wins
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.studioOtherStats?.challenges}</span>
                            Challenges
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {numberToFixed(props.studioOtherStats?.rank?.overallPercentile || 0)}
                                %
                            </span>
                            Percentile
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {numberToFixed(props.studioOtherStats?.screeningSuccessRate || 0)}
                                %
                            </span>
                            Screening Success Rate
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {numberToFixed(props.studioOtherStats?.avgPlacement || 0)}
                            </span>
                            Average Placement
                        </div>
                    </div>

                    {/* TODO: Add Studio Other details data */}
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

export default StudioOtherDetailsModal
