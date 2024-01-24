/* eslint-disable max-len */
import React, { ChangeEvent } from 'react'

import { Button, InputSelect, InputText } from '~/libs/ui'

import styles from './FilterBar.module.scss'

type FilterOptions = {
    label: string
    value: string
}

type Filter = {
    key: string
    label: string
    type: 'input' | 'dropdown'
    options?: FilterOptions[]
}

interface FilterBarProps {
    filters: Filter[],
    onFilterChange: (key: string, value: string[]) => void
    onResetFilters?: () => void
}

const FilterBar: React.FC<FilterBarProps> = (props: FilterBarProps) => {
    const [selectedValue, setSelectedValue] = React.useState<Map<string, string>>(new Map())

    const renderDropdown = (index: number, filter: Filter): JSX.Element => (
        <InputSelect
            tabIndex={index}
            value={selectedValue.get(filter.key) ?? ''}
            options={filter.options!}
            onChange={function onChange(event: ChangeEvent<HTMLInputElement>) {
                setSelectedValue(new Map(selectedValue.set(filter.key, event.target.value)))
                props.onFilterChange(filter.key, [event.target.value])
            }}
            name={filter.key}
            label={filter.label}
            dirty
            placeholder={filter.label}
        />
    )

    return (
        <div className={styles.FilterBar}>
            <div className={styles.filterContainer}>
                {props.filters.map((options, index) => (
                    <div key={options.key}>
                        {options.type === 'dropdown' && renderDropdown(index, options)}
                        {options.type === 'input' && (
                            <InputText
                                key={options.key}
                                name={options.label}
                                type='text'
                                tabIndex={index}
                                onChange={function onChange(event: ChangeEvent<HTMLInputElement>) {
                                    props.onFilterChange(options.key, [event.target.value])
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>
            <Button
                primary
                className={styles.resetButton}
                label='Reset'
                onClick={function onResetClick() {
                    setSelectedValue(new Map())
                    props.onResetFilters?.()
                }}
            />
        </div>
    )
}

export default FilterBar
