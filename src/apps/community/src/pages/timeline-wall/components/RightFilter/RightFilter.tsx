/* eslint-disable react/jsx-no-bind */
import {
    FC,
    useEffect,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'
import moment from 'moment'

import { type TimelineEvent } from '../../../../lib/models'

import styles from './RightFilter.module.scss'

interface TimelineFilterValue {
    month: number
    year: number
}

interface FilterYear {
    months: Array<{
        label: string
        value: number
    }>
    year: number
}

interface RightFilterProps {
    className?: string
    events: TimelineEvent[]
    selectedFilterValue: TimelineFilterValue
    setSelectedFilterValue: (value: TimelineFilterValue) => void
}

/**
 * Sidebar filter for jumping to a year or month in the timeline wall.
 *
 * @param props Filter state and event list.
 * @returns Year/month filter panel.
 */
const RightFilter: FC<RightFilterProps> = (props: RightFilterProps) => {
    const [yearList, setYearList] = useState<FilterYear[]>([])

    const earliestEventYear = useMemo(() => {
        if (!props.events.length) {
            return 2002
        }

        const eventYears = props.events
            .map(event => moment(event.eventDate)
                .year())
            .filter(year => Number.isFinite(year))

        if (!eventYears.length) {
            return 2002
        }

        return Math.min(Math.min(...eventYears), 2002)
    }, [props.events])

    useEffect(() => {
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth()
        const years: FilterYear[] = []

        for (let year = currentYear; year >= earliestEventYear; year -= 1) {
            const months: FilterYear['months'] = []
            const maxMonth = year === currentYear ? currentMonth : 11

            for (let month = maxMonth; month >= 0; month -= 1) {
                months.push({
                    label: moment()
                        .month(month)
                        .format('MMMM'),
                    value: month,
                })
            }

            years.push({
                months,
                year,
            })
        }

        setYearList(years)
    }, [earliestEventYear])

    return (
        <div className={classNames(styles.container, props.className)}>
            <div className={styles.header}>
                <span>Timeline Wall</span>
                <button
                    className={styles.closeButton}
                    onClick={() => props.setSelectedFilterValue(props.selectedFilterValue)}
                    type='button'
                >
                    ✕
                </button>
            </div>

            <div className={styles.content}>
                {yearList.map(yearObject => {
                    const isOnlyYearSelected = yearObject.year === props.selectedFilterValue.year
                        && props.selectedFilterValue.month < 0
                    const isYearSelected = yearObject.year === props.selectedFilterValue.year

                    return (
                        <div className={styles.listItem} key={yearObject.year}>
                            <button
                                className={classNames(
                                    styles.blockItem,
                                    isYearSelected && styles.selected,
                                    isOnlyYearSelected && styles.fullSelected,
                                )}
                                onClick={() => {
                                    if (isOnlyYearSelected) {
                                        props.setSelectedFilterValue({
                                            month: -1,
                                            year: 0,
                                        })
                                        return
                                    }

                                    props.setSelectedFilterValue({
                                        month: -1,
                                        year: yearObject.year,
                                    })
                                }}
                                type='button'
                            >
                                <div className={styles.blockItemTitle}>
                                    <span>{yearObject.year}</span>
                                </div>
                            </button>

                            <div
                                className={classNames(
                                    styles.childList,
                                    isYearSelected
                                    && props.selectedFilterValue.month >= 0
                                    && styles.monthSelected,
                                )}
                            >
                                {yearObject.months.map(month => {
                                    const isMonthSelected = yearObject.year === props.selectedFilterValue.year
                                        && props.selectedFilterValue.month === month.value

                                    return (
                                        <button
                                            className={classNames(
                                                styles.blockItem,
                                                isMonthSelected && styles.selected,
                                                isMonthSelected && styles.fullSelected,
                                            )}
                                            key={`${yearObject.year}-${month.value}`}
                                            onClick={() => {
                                                if (isMonthSelected) {
                                                    props.setSelectedFilterValue({
                                                        month: -1,
                                                        year: 0,
                                                    })
                                                    return
                                                }

                                                props.setSelectedFilterValue({
                                                    month: month.value,
                                                    year: yearObject.year,
                                                })
                                            }}
                                            type='button'
                                        >
                                            <span>{month.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default RightFilter
