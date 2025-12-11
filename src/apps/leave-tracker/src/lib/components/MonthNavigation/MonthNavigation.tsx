import { FC } from 'react'

import { Button, IconOutline } from '~/libs/ui'

import { formatMonthYear } from '../../utils'

import styles from './MonthNavigation.module.scss'

interface MonthNavigationProps {
    currentDate: Date
    onNextMonth: () => void
    onPrevMonth: () => void
}

export const MonthNavigation: FC<MonthNavigationProps> = ({
    currentDate,
    onNextMonth,
    onPrevMonth,
}) => (
    <div className={styles.navigation}>
        <Button
            aria-label='Previous month'
            className={styles.navButton}
            icon={IconOutline.ChevronLeftIcon}
            onClick={onPrevMonth}
            secondary
        />
        <div className={styles.currentMonth}>{formatMonthYear(currentDate)}</div>
        <Button
            aria-label='Next month'
            className={styles.navButton}
            icon={IconOutline.ChevronRightIcon}
            iconToRight
            onClick={onNextMonth}
            secondary
        />
    </div>
)

export default MonthNavigation
