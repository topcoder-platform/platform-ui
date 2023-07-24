/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal } from '~/libs/ui'
import {
    MemberStats,
} from '~/libs/core'

import { numberToFixed } from '../../lib'

import styles from './BannersIconsDetailsModal.module.scss'

type WebDesignViewTypes = 'CHALLENGES DETAILS'

interface BannersIconsDetailsModalProps {
    onClose: () => void
    bannersIconsStats: MemberStats | undefined
}

const BannersIconsDetailsModal: FC<BannersIconsDetailsModalProps> = (props: BannersIconsDetailsModalProps) => {
    const [viewType]: [WebDesignViewTypes, Dispatch<SetStateAction<WebDesignViewTypes>>]
        = useState<WebDesignViewTypes>('CHALLENGES DETAILS')

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='body'
            title='Banners Or Icons'
        >

            <div className={styles.container}>
                <div className='member-stat-header'>
                    <div>
                        <span className='member-stat-value'>{props.bannersIconsStats?.wins}</span>
                        Wins
                    </div>
                    <div>
                        <span className='member-stat-value'>{props.bannersIconsStats?.challenges}</span>
                        Challenges
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.bannersIconsStats?.rank?.overallPercentile || 0)}
                            %
                        </span>
                        Percentile
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.bannersIconsStats?.screeningSuccessRate || 0)}
                            %
                        </span>
                        Screening Success Rate
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.bannersIconsStats?.avgPlacement || 0)}
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

export default BannersIconsDetailsModal
