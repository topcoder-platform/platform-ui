/**
 * Bordered card showing one participation statistic next to its icon.
 */
import { FC, FunctionComponent, SVGProps } from 'react'

import styles from './StatCard.module.scss'

interface StatCardProps {
    readonly icon: FunctionComponent<SVGProps<SVGSVGElement>>
    readonly label: string
    readonly value?: number
}

export const StatCard: FC<StatCardProps> = (props: StatCardProps) => {
    const Icon: FunctionComponent<SVGProps<SVGSVGElement>> = props.icon

    return (
        <div className={styles.statCard}>
            <Icon className={styles.icon} />
            <div className={styles.stat}>
                <div className={styles.value}>
                    {props.value?.toLocaleString() ?? '-'}
                </div>
                <div className={styles.label}>{props.label}</div>
            </div>
        </div>
    )
}

export default StatCard
