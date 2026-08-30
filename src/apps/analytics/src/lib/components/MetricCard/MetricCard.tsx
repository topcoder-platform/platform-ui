/** Accessible KPI card for analytics totals and conversion rates. */
/* eslint-disable ordered-imports/ordered-imports */
import classNames from 'classnames'
import { FC, ReactNode } from 'react'

import styles from './MetricCard.module.scss'

interface MetricCardProps {
    context?: ReactNode
    label: string
    tone?: 'default' | 'highlight' | 'success'
    value: ReactNode
}

/**
 * Renders one headline analytic with optional explanatory context.
 *
 * @param props label, formatted value, context, and visual tone.
 * @returns semantic KPI card.
 * @throws Does not throw.
 */
export const MetricCard: FC<MetricCardProps> = props => (
    <article className={classNames(styles.card, styles[props.tone ?? 'default'])}>
        <div className={styles.label}>{props.label}</div>
        <div className={styles.value}>{props.value}</div>
        {props.context && <div className={styles.context}>{props.context}</div>}
    </article>
)

export default MetricCard
