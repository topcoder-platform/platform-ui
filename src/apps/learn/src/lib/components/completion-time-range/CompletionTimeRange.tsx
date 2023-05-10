import { FC } from 'react'

import { TCACertificationCompletionTimeRange } from '../../data-providers'

import styles from './CompletionTimeRange.module.scss'

interface CompletionTimeRangeProps {
    range: TCACertificationCompletionTimeRange
}

const CompletionTimeRange: FC<CompletionTimeRangeProps> = (props: CompletionTimeRangeProps) => (
    <div className={styles.wrap}>
        <span className='range-value lower-value'>
            {props.range.lowRangeValue}
        </span>
        <span className='range-dash'>
            -
        </span>
        <span className='range-value higher-value'>
            {props.range.highRangeValue}
        </span>
        &nbsp;
        <span className='units'>
            {props.range.units}
        </span>
    </div>
)

export default CompletionTimeRange
