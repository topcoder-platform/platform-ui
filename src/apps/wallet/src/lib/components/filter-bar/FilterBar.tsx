/* eslint-disable max-len */
import React, { ChangeEvent } from 'react'

import { Button, InputSelect, InputText } from '~/libs/ui'
import { InputHandleAutocomplete, MembersAutocompeteResult } from '~/apps/gamification-admin/src/game-lib'

import styles from './FilterBar.module.scss'

type FilterOptions = {
    label: string
    value: string
}

type Filter = {
    key: string
    label: string
    type: 'input' | 'dropdown' | 'member_autocomplete'
    options?: FilterOptions[]
}

interface FilterBarProps {
    filters: Filter[],
    onFilterChange: (key: string, value: string[]) => void
    onResetFilters?: () => void
}

const FilterBar: React.FC<FilterBarProps> = (props: FilterBarProps) => {
    const [selectedValue, setSelectedValue] = React.useState<Map<string, string | any[]>>(new Map())

    const renderDropdown = (index: number, filter: Filter): JSX.Element => (
        <InputSelect
            tabIndex={index}
            value={selectedValue.get(filter.key) as string ?? ''}
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

    const renderMemberAutoComplete = (index: number, filter: Filter): JSX.Element => (
        <InputHandleAutocomplete
            label={filter.label}
            name={filter.key}
            className={styles.filterInput}
            placeholder={filter.label}
            onChange={function onChange(event: Array<MembersAutocompeteResult>) {
                setSelectedValue(new Map(selectedValue.set(filter.key, event)))
                props.onFilterChange(filter.key, event.map(member => member.userId))
            }}
            tabIndex={index}
        />
    )

    return (
        <div className={styles.FilterBar}>
            <div className={styles.filterContainer}>
                {props.filters.map((options, index) => (
                    <div key={options.key} className={styles.filter}>
                        {options.type === 'dropdown' && renderDropdown(index, options)}
                        {options.type === 'input' && (
                            <InputText
                                key={options.key}
                                name={options.label}
                                className={styles.filterInput}
                                type='text'
                                tabIndex={index}
                                onChange={function onChange(event: ChangeEvent<HTMLInputElement>) {
                                    if (event.target.value === '') {
                                        setSelectedValue(new Map(selectedValue.set(options.key, '')))
                                        props.onFilterChange(options.key, [])
                                    } else {
                                        props.onFilterChange(options.key, [event.target.value])
                                    }
                                }}
                            />
                        )}
                        {options.type === 'member_autocomplete' && renderMemberAutoComplete(index, options)}
                    </div>
                ))}
            </div>
            <Button
                primary
                className={styles.resetButton}
                label='Reset'
                size='lg'
                disabled={selectedValue.size === 0}
                onClick={function onResetClick() {
                    setSelectedValue(new Map())
                    props.onResetFilters?.()
                }}
            />
        </div>
    )
}

export default FilterBar
