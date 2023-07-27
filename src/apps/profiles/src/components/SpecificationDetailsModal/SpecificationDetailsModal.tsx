/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal } from '~/libs/ui'
import {
    MemberStats,
} from '~/libs/core'

import { numberToFixed } from '../../lib'

import styles from './SpecificationDetailsModal.module.scss'

type WebDesignViewTypes = 'CHALLENGES DETAILS'

interface SpecificationDetailsModalProps {
    onClose: () => void
    specStats: MemberStats | undefined
}

const SpecificationDetailsModal: FC<SpecificationDetailsModalProps> = (props: SpecificationDetailsModalProps) => {
    // TODO: Enable this when we have challenges details data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [viewType]: [WebDesignViewTypes, Dispatch<SetStateAction<WebDesignViewTypes>>]
        = useState<WebDesignViewTypes>('CHALLENGES DETAILS')

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='body'
            title='Specification'
        >

            <div className={styles.container}>
                <div className='member-stat-header'>
                    <div>
                        <span className='member-stat-value'>{props.specStats?.wins}</span>
                        Wins
                    </div>
                    <div>
                        <span className='member-stat-value'>{props.specStats?.challenges}</span>
                        Challenges
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.specStats?.rank?.overallPercentile || 0)}
                            %
                        </span>
                        Percentile
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.specStats?.screeningSuccessRate || 0)}
                            %
                        </span>
                        Screening Success Rate
                    </div>
                    <div>
                        <span className='member-stat-value'>
                            {numberToFixed(props.specStats?.avgPlacement || 0)}
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

export default SpecificationDetailsModal
