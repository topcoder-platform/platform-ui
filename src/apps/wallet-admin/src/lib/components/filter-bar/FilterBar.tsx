/* eslint-disable react/jsx-no-bind */
import React, { ChangeEvent, useRef } from 'react'

import { Button, IconOutline, InputSelect, InputText } from '~/libs/ui'
import {
    InputHandleAutocomplete,
    MembersAutocompeteResult,
} from '~/apps/admin/src/platform/gamification-admin/src/game-lib'

import styles from './FilterBar.module.scss'

type FilterOptions = {
    label: string;
    value: string;
};

type Filter = {
    key: string;
    label: string;
    type: 'input' | 'dropdown' | 'member_autocomplete';
    options?: FilterOptions[];
};

interface FilterBarProps {
    filters: Filter[];
    showExportButton?: boolean;
    onFilterChange: (key: string, value: string[]) => void;
    onResetFilters?: () => void;
    onExport?: () => void;
}

const FilterBar: React.FC<FilterBarProps> = (props: FilterBarProps) => {
    const [selectedValue, setSelectedValue] = React.useState<Map<string, string | any[]>>(new Map())
    const selectedMembers = useRef<MembersAutocompeteResult[]>([])

    const renderDropdown = (index: number, filter: Filter): JSX.Element => (
        <InputSelect
            tabIndex={index}
            value={selectedValue.get(filter.key) as string ?? (filter.key === 'pageSize' ? '10' : '')}
            options={filter.options!}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
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
            onChange={(event: Array<MembersAutocompeteResult>) => {
                selectedMembers.current = event
                setSelectedValue(new Map(selectedValue.set(filter.key, event)))
                props.onFilterChange(filter.key, event.map(member => member.userId))
            }}
            tabIndex={index}
            value={selectedMembers.current}
        />
    )

    return (
        <div className={styles.FilterBar}>
            <div className={styles.firstFilter}>
                {props.filters.slice(0, 1)
                    .map((options, index) => (
                        <div key={options.key} className={styles.firstFilterElement}>
                            {options.type === 'dropdown' && renderDropdown(index, options)}
                            {options.type === 'input' && (
                                <InputText
                                    key={options.key}
                                    name={options.label}
                                    className={styles.filterInput}
                                    type='text'
                                    tabIndex={index}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        setSelectedValue(new Map(selectedValue.set(options.key, event.target.value)))
                                        props.onFilterChange(options.key, [event.target.value])
                                    }}
                                />
                            )}
                            {options.type === 'member_autocomplete' && renderMemberAutoComplete(index, options)}
                        </div>
                    ))}
            </div>
            <div className={styles.flexStretch} />
            <div className={styles.remainingFilters}>
                {props.filters.slice(1)
                    .map((options, index) => (
                        <div key={options.key} className={styles.filter}>
                            {options.type === 'dropdown' && renderDropdown(index + 1, options)}
                            {options.type === 'input' && (
                                <InputText
                                    key={options.key}
                                    name={options.label}
                                    className={styles.filterInput}
                                    type='text'
                                    tabIndex={index + 1}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        setSelectedValue(new Map(selectedValue.set(options.key, event.target.value)))
                                        props.onFilterChange(options.key, [event.target.value])
                                    }}
                                />
                            )}
                            {options.type === 'member_autocomplete' && renderMemberAutoComplete(index + 1, options)}
                        </div>
                    ))}
            </div>
            {props.showExportButton && (
                <Button
                    className={styles.exportButton}
                    icon={IconOutline.DownloadIcon}
                    onClick={props.onExport}
                    size='lg'
                />
            )}
            <Button
                primary
                className={styles.resetButton}
                label='Reset'
                size='lg'
                disabled={selectedValue.size === 0}
                onClick={() => {
                    selectedMembers.current = []
                    setSelectedValue(new Map())
                    props.onResetFilters?.()
                }}
            />
        </div>
    )
}

export default FilterBar
