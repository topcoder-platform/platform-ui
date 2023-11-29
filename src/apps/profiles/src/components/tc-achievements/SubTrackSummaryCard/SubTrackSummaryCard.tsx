import { FC } from 'react'
import classNames from 'classnames'

import { IconSolid } from '~/libs/ui'

import { subTrackLabelToHumanName, WinnerIcon } from '../../../lib'

import styles from './SubTrackSummaryCard.module.scss'

interface SubTrackSummaryCardProps {
    title: string
    wins: number
    submissions: number
}

const SubTrackSummaryCard: FC<SubTrackSummaryCardProps> = props => (
    <div className={styles.wrap}>
        <div className={styles.title}>
            <span className='body-main-medium'>
                {subTrackLabelToHumanName(props.title)}
            </span>
        </div>
        <div className={styles.statsWrap}>
            <div className={styles.stats}>
                {props.wins > 0 && (
                    <div className={styles.statsItem}>
                        <WinnerIcon className={classNames('icon-xxl', styles.winnerIcon)} />
                        <span className={styles.statsItemValue}>
                            {props.wins}
                        </span>
                        <span className={styles.statsItemLabel}>
                            <span className='label'>wins</span>
                        </span>
                    </div>
                )}
                <div className={styles.statsItem}>
                    <span className={styles.statsItemValue}>
                        {props.submissions}
                    </span>
                    <span className={styles.statsItemLabel}>
                        <span className='label'>submissions</span>
                    </span>
                </div>
            </div>
            <div className={styles.statsItemIcon}>
                <IconSolid.ChevronRightIcon className='icon-xl' />
            </div>
        </div>
    </div>
)

export default SubTrackSummaryCard
