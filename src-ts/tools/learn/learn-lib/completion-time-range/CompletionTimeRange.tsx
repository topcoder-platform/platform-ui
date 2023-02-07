import { FC } from 'react'

import { TCACertificationCompletionTimeRange } from '../data-providers'

import styles from './CompletionTimeRange.module.scss'

interface CompletionTimeRangeProps {
    range: TCACertificationCompletionTimeRange
}

const CompletionTimeRange: FC<CompletionTimeRangeProps> = (props: CompletionTimeRangeProps) => (
    <div className={styles.wrap}>
        {props.range.lowRangeValue}
        -
        {props.range.highRangeValue}
        &nbsp;
        {props.range.units}
    </div>
)

export default CompletionTimeRange
