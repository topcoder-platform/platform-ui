/* Handlers capture the independent category being selected. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true }] */
import { FC } from 'react'

import { SalesDashboardFilterOptions, SalesDashboardFilters as Filters } from './sales-dashboard.service'
import styles from './SalesDashboardsPage.module.scss'

const fields = [
    { key: 'offeringType', label: 'Offering Type' },
    { key: 'dealCategory', label: 'Deal Category' },
    { key: 'customerType', label: 'Customer Type' },
] as const

/**
 * Selects independent card filters from the source's available categories.
 * @param props Selected filters, unfiltered choices, and a callback applying changes immediately.
 * @returns Three labelled dropdowns; ALL clears a field and unavailable fields are disabled.
 * @throws Does not throw.
 */
const SalesDashboardFilters: FC<{
    value: Filters; options?: SalesDashboardFilterOptions; onChange: (value: Filters) => void
}> = props => (
    <div className={styles.filters}>
        {fields.map(field => (
            <label key={field.key}>
                {field.label}
                <select
                    value={props.value[field.key]?.[0] ?? ''}
                    disabled={!props.options?.[field.key]?.length}
                    onChange={event => {
                        const next = { ...props.value }
                        if (event.target.value) next[field.key] = [event.target.value]
                        else delete next[field.key]
                        props.onChange(next)
                    }}
                >
                    <option value=''>ALL</option>
                    {props.options?.[field.key]?.map(value => <option key={value} value={value}>{value}</option>)}
                </select>
            </label>
        ))}
    </div>
)

export default SalesDashboardFilters
