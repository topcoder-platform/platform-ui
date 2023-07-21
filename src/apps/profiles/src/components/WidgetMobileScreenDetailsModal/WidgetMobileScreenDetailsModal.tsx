/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal } from '~/libs/ui'
import {
    MemberStats,
} from '~/libs/core'

import { numberToFixed } from '../../lib'

import styles from './WidgetMobileScreenDetailsModal.module.scss'

type WebDesignViewTypes = 'CHALLENGES DETAILS'

interface WidgetMobileScreenDetailsModalProps {
    onClose: () => void
    widgetMobileStats: MemberStats | undefined
}

const WidgetMobileScreenDetailsModal: FC<WidgetMobileScreenDetailsModalProps>
    = (props: WidgetMobileScreenDetailsModalProps) => {
        const [viewType]: [WebDesignViewTypes, Dispatch<SetStateAction<WebDesignViewTypes>>]
            = useState<WebDesignViewTypes>('CHALLENGES DETAILS')

        return (
            <BaseModal
                onClose={props.onClose}
                open
                size='body'
                title='Widget or Mobile Screen Design'
            >

                <div className={styles.container}>
                    <div className='member-stat-header'>
                        <div>
                            <span className='member-stat-value'>{props.widgetMobileStats?.wins}</span>
                            Wins
                        </div>
                        <div>
                            <span className='member-stat-value'>{props.widgetMobileStats?.challenges}</span>
                            Challenges
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {numberToFixed(props.widgetMobileStats?.rank?.overallPercentile || 0)}
                                %
                            </span>
                            Percentile
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {numberToFixed(props.widgetMobileStats?.screeningSuccessRate || 0)}
                                %
                            </span>
                            Screening Success Rate
                        </div>
                        <div>
                            <span className='member-stat-value'>
                                {numberToFixed(props.widgetMobileStats?.avgPlacement || 0)}
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

export default WidgetMobileScreenDetailsModal
