import React, { FC } from 'react'

import { InputSelect } from '../../../../lib'

import styles from './FilterBar.module.scss'

interface FilterBarProps {
    certsCategoriesOptions: Array<{
        label: string,
        value: string,
    }>
    onSelectCategory: (event: React.ChangeEvent<HTMLInputElement>) => void
    selectedCategory: string
}

const FilterBar: FC<FilterBarProps> = (props: FilterBarProps) => (
    <div className={styles.coursesListFilters}>
        <InputSelect
            options={props.certsCategoriesOptions}
            value={props.selectedCategory}
            onChange={props.onSelectCategory}
            name='filter-courses'
            label='Categories'
        />
    </div>
)

export default FilterBar
