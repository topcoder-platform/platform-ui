/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal } from '~/libs/ui'
import {
    MemberStats,
} from '~/libs/core'

import { numberToFixed } from '../../lib'

import styles from './FEDesignDetailsModal.module.scss'

type WebDesignViewTypes = 'CHALLENGES DETAILS'

interface FEDesignDetailsModalProps {
    onClose: () => void
    feDesignStats: MemberStats | undefined
}

const FEDesignDetailsModal: FC<FEDesignDetailsModalProps>
    = (props: FEDesignDetailsModalProps) => {
        // TODO: Enable this when we have challenges details data
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [viewType]: [WebDesignViewTypes, Dispatch<SetStateAction<WebDesignViewTypes>>]
            = useState<WebDesignViewTypes>('CHALLENGES DETAILS')

        return (
            <BaseModal
                onClose={props.onClose}
                open
                size='body'
                title='Application Front End Design'
            >

                <div className={styles.container}>
                    <div className='member-stat-header'>
                        <div>
                            <span className='member-stat-value'>{props.feDesignStats?.wins}</span>
                            Wins
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.feDesignStats?.challenges}</span>
                            Challenges
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {numberToFixed(props.feDesignStats?.rank?.overallPercentile || 0)}
                                %
                            </span>
                            Percentile
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {numberToFixed(props.feDesignStats?.screeningSuccessRate || 0)}
                                %
                            </span>
                            Screening Success Rate
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {numberToFixed(props.feDesignStats?.avgPlacement || 0)}
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

export default FEDesignDetailsModal
