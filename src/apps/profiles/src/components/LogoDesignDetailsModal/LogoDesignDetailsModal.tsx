/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal } from '~/libs/ui'
import {
    MemberStats,
} from '~/libs/core'

import { numberToFixed } from '../../lib'

import styles from './LogoDesignDetailsModal.module.scss'

type WebDesignViewTypes = 'CHALLENGES DETAILS'

interface LogoDesignDetailsModalProps {
    isLogoDesignDetailsOpen: boolean
    onClose: () => void
    logoDesignStats: MemberStats | undefined
}

const LogoDesignDetailsModal: FC<LogoDesignDetailsModalProps> = (props: LogoDesignDetailsModalProps) => {
    const [viewType]: [WebDesignViewTypes, Dispatch<SetStateAction<WebDesignViewTypes>>]
        = useState<WebDesignViewTypes>('CHALLENGES DETAILS')

    return (
        <BaseModal
            onClose={props.onClose}
            open={props.isLogoDesignDetailsOpen}
            size='body'
            title='LOGO DESIGN'
        >

            <div className={styles.container}>
                <div className='member-stat-header'>
                    <div>
                        <span className='member-stat-value'>{props.logoDesignStats?.wins}</span>
                        Wins
                    </div>
                    <div>
                        <span className='member-stat-value'>{props.logoDesignStats?.challenges}</span>
                        Challenges
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.logoDesignStats?.rank?.overallPercentile || 0)}
                            %
                        </span>
                        Percentile
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.logoDesignStats?.screeningSuccessRate || 0)}
                            %
                        </span>
                        Screening Success Rate
                    </div>
                    <div>
                        <span className='member-stat-value'>{props.logoDesignStats?.avgPlacement}</span>
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

export default LogoDesignDetailsModal
