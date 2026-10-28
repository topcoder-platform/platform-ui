import { ChangeEvent, FC, useCallback } from 'react'

import { SalesDashboardGroupBy as GroupBy } from './sales-dashboard.service'
import styles from './SalesDashboardsPage.module.scss'

const categories: Array<{ value: GroupBy; label: string }> = [
    { label: 'Offering Type', value: 'offeringType' },
    { label: 'Deal Category', value: 'dealCategory' },
    { label: 'Customer Type', value: 'customerType' },
]

/**
 * Selects the business dimension whose categories appear together in the chart and monthly table.
 * @param props Current dimension, selection callback and whether Pipeline's Stage option is available.
 * @returns One labelled Filter by dropdown. Does not throw.
 */
const SalesDashboardGroupBy: FC<{ value: GroupBy; onChange: (value: GroupBy) => void; pipeline?: boolean }> = props => {
    const change = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        props.onChange(event.target.value as GroupBy)
    }, [props])
    return (
        <div className={styles.filters}>
            <label>
                Filter by
                <select value={props.value} onChange={change}>
                    {props.pipeline && <option value='stage'>Stage</option>}
                    {categories.map(category => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                </select>
            </label>
        </div>
    )
}

export default SalesDashboardGroupBy
