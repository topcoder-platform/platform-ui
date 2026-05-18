/* eslint-disable react/jsx-no-bind */
import React, { ChangeEvent, useEffect, useRef } from 'react'
import Select, { MultiValue } from 'react-select'
import classNames from 'classnames'

import { Button, IconOutline, InputDatePicker, InputSelect, InputText } from '~/libs/ui'
import {
    InputHandleAutocomplete,
    MembersAutocompeteResult,
} from '~/apps/admin/src/platform/gamification-admin/src/game-lib'

import styles from './FilterBar.module.scss'

type FilterOptions = {
    label: string;
    value: string;
};

const SELECT_ALL_SENTINEL = '__select_all__'

export type Filter = {
    key: string;
    label: string;
    type: 'input' | 'dropdown' | 'member_autocomplete' | 'multi_dropdown' | 'date';
    options?: FilterOptions[];
};

/**
 * Describes a selection-scoped action rendered beside the wallet-admin filters.
 *
 * @remarks Wallet-admin uses these actions for bulk payment approval and
 * rejection flows that only appear when table rows are selected.
 */
interface FilterBarSelectionAction {
    appearance?: 'primary' | 'secondary'
    key: string
    label: string
    onClick: () => void
    variant?: 'danger' | 'warning' | 'linkblue' | 'round' | 'tc-green'
}

interface FilterBarProps {
    filters: Filter[];
    showExportButton?: boolean;
    onFilterChange: (key: string, value: string[]) => void;
    onResetFilters?: () => void;
    onExport?: () => void;
    selectedCount?: number;
    onBulkClick?: () => void;
    selectionActions?: FilterBarSelectionAction[];
    selectedValueOverrides?: Record<string, string | string[]>;
    hasActiveFilters?: boolean;
}

function parseIsoDateOnly(value: string | undefined): Date | undefined {
    if (!value) {
        return undefined
    }

    const [y, m, d] = value.split('-')
        .map(part => parseInt(part, 10))
    if (!y || !m || !d) {
        return undefined
    }

    return new Date(y, m - 1, d)
}

function formatIsoDateOnly(date: Date | null): string[] {
    if (!date) {
        return []
    }

    const y = date.getFullYear()
    const mo = String(date.getMonth() + 1)
        .padStart(2, '0')
    const day = String(date.getDate())
        .padStart(2, '0')

    return [`${y}-${mo}-${day}`]
}

const FilterBar: React.FC<FilterBarProps> = (props: FilterBarProps) => {
    const [selectedValue, setSelectedValue] = React.useState<Map<string, string | any[]>>(new Map())
    const selectedMembers = useRef<MembersAutocompeteResult[]>([])
    const selectedCount = props.selectedCount ?? 0
    const selectionActions = props.selectionActions
        ?? (selectedCount > 0 && props.onBulkClick
            ? [{
                appearance: 'primary' as const,
                key: 'bulk-approve',
                label: `Approve (${selectedCount})`,
                onClick: props.onBulkClick,
            }]
            : [])

    useEffect(() => {
        props.filters.forEach(filter => {
            if (filter.type !== 'multi_dropdown') {
                return
            }

            const override = props.selectedValueOverrides?.[filter.key]
            const next = Array.isArray(override)
                ? override
                : (override ? [override] : [])
            setSelectedValue(prev => {
                const cur = (prev.get(filter.key) as string[] | undefined) ?? []
                if (cur.length === next.length && cur.every((v, i) => v === next[i])) {
                    return prev
                }

                return new Map(prev.set(filter.key, next))
            })
        })
    }, [props.filters, props.selectedValueOverrides])

    const renderDropdown = (index: number, filter: Filter): JSX.Element => (
        <InputSelect
            tabIndex={index}
            value={typeof props.selectedValueOverrides?.[filter.key] === 'string'
                ? props.selectedValueOverrides?.[filter.key] as string
                : selectedValue.get(filter.key) as string
                ?? (filter.key === 'pageSize' ? '10' : '')}
            options={filter.options ?? []}
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

    const renderMultiDropdown = (index: number, filter: Filter): JSX.Element => {
        const baseOptions = filter.options ?? []
        const menuOptions = [
            { label: 'Select All', value: SELECT_ALL_SENTINEL },
            ...baseOptions,
        ]
        const override = props.selectedValueOverrides?.[filter.key]
        const valuesFromParent: string[] = Array.isArray(override)
            ? override as string[]
            : (override ? [override as string] : (selectedValue.get(filter.key) as string[] | undefined) ?? [])
        const selectedOptions = baseOptions.filter(o => valuesFromParent.includes(o.value))

        return (
            <div className={classNames(styles.filter, styles.multiSelectWrap)}>
                <span className={classNames('body-small-bold', styles.multiSelectLabel)}>
                    {filter.label}
                </span>
                <Select
                    classNamePrefix='wallet-admin-ms'
                    inputId={`${filter.key}-multiselect`}
                    isMulti
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    tabIndex={index}
                    placeholder={filter.label}
                    options={menuOptions}
                    value={selectedOptions}
                    onChange={(raw: MultiValue<FilterOptions>) => {
                        const picked = raw.map(o => o.value)
                        if (picked.includes(SELECT_ALL_SENTINEL)) {
                            const allValues = baseOptions.map(o => o.value)
                            setSelectedValue(new Map(selectedValue.set(filter.key, allValues)))
                            props.onFilterChange(filter.key, allValues)

                            return
                        }

                        setSelectedValue(new Map(selectedValue.set(filter.key, picked)))
                        props.onFilterChange(filter.key, picked)
                    }}
                />
            </div>
        )
    }

    const renderDate = (index: number, filter: Filter): JSX.Element => {
        const override = props.selectedValueOverrides?.[filter.key]
        const iso = typeof override === 'string'
            ? override
            : undefined

        return (
            <div className={classNames(styles.filter, styles.dateFilterWrap)} key={filter.key}>
                <InputDatePicker
                    tabIndex={index}
                    label={filter.label}
                    disabled={false}
                    date={parseIsoDateOnly(iso)}
                    placeholder='Date'
                    onChange={(date: Date | null) => {
                        props.onFilterChange(filter.key, formatIsoDateOnly(date))
                    }}
                    isClearable
                />
            </div>
        )
    }

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

    const renderFilterControl = (index: number, filter: Filter): JSX.Element => {
        if (filter.type === 'dropdown') {
            return renderDropdown(index, filter)
        }

        if (filter.type === 'multi_dropdown') {
            return renderMultiDropdown(index, filter)
        }

        if (filter.type === 'date') {
            return renderDate(index, filter)
        }

        if (filter.type === 'member_autocomplete') {
            return renderMemberAutoComplete(index, filter)
        }

        return (
            <InputText
                key={filter.key}
                name={filter.label}
                className={styles.filterInput}
                type='text'
                tabIndex={index}
                label={filter.label}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setSelectedValue(new Map(selectedValue.set(filter.key, event.target.value)))
                    props.onFilterChange(filter.key, [event.target.value])
                }}
            />
        )
    }

    return (
        <div className={styles.FilterBar}>
            <div className={styles.firstFilter}>
                {props.filters.slice(0, 1)
                    .map((filter, index) => (
                        <div key={filter.key} className={styles.firstFilterElement}>
                            {renderFilterControl(index, filter)}
                        </div>
                    ))}
            </div>
            <div className={styles.flexStretch} />
            <div className={styles.remainingFilters}>
                {props.filters.slice(1)
                    .map((filter, index) => (
                        <div key={filter.key} className={styles.filter}>
                            {renderFilterControl(index + 1, filter)}
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
                disabled={props.hasActiveFilters === undefined ? selectedValue.size === 0 : !props.hasActiveFilters}
                onClick={() => {
                    selectedMembers.current = []
                    setSelectedValue(new Map())
                    props.onResetFilters?.()
                }}
            />
            {selectionActions.length > 0 && (
                <div className={styles.taskApproveBtns}>
                    {selectionActions.map(action => (
                        <Button
                            key={action.key}
                            primary={action.appearance !== 'secondary'}
                            secondary={action.appearance === 'secondary'}
                            variant={action.variant}
                            className={styles.selectionActionButton}
                            label={action.label}
                            size='lg'
                            onClick={action.onClick}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default FilterBar
