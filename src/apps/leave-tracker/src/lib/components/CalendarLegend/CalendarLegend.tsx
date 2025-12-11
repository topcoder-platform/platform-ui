import classNames from 'classnames'
import { FC } from 'react'

import { legendItems } from '../../utils'

import styles from './CalendarLegend.module.scss'

export const CalendarLegend: FC = () => (
    <div className={styles.legend}>
        {legendItems.map(item => (
            <div key={item.label} className={styles.item}>
                <span className={classNames(styles.color, styles[item.statusClass])} />
                <span className={styles.label}>{item.label}</span>
            </div>
        ))}
    </div>
)

export default CalendarLegend
