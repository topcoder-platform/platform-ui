import { ChangeEvent, FC, useMemo } from 'react'
import Select, { SingleValue } from 'react-select'

import {
    Button,
    IconOutline,
} from '~/libs/ui'

import styles from './ProjectsShowcaseFilter.module.scss'

interface SelectOption {
    label: string
    value: string
}

interface ProjectsShowcaseFilterProps {
    keywordInput: string
    selectedStatus?: SelectOption
    selectedIndustry?: SelectOption
    selectedCategory?: SelectOption
    industryOptions: SelectOption[]
    categoryOptions: SelectOption[]
    isIndustriesLoading: boolean
    isCategoriesLoading: boolean
    onSearchInputChange: (event: ChangeEvent<HTMLInputElement>) => void
    onStatusChange: (option: SingleValue<SelectOption>) => void
    onIndustryChange: (option: SingleValue<SelectOption>) => void
    onCategoryChange: (option: SingleValue<SelectOption>) => void
    onResetFilters: () => void
}

const STATUS_OPTIONS: SelectOption[] = [
    { label: 'All statuses', value: '' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Published', value: 'PUBLISHED' },
    { label: 'Archived', value: 'ARCHIVED' },
]

export const ProjectsShowcaseFilter: FC<ProjectsShowcaseFilterProps> = (props: ProjectsShowcaseFilterProps) => {
    const statusOptions = useMemo<SelectOption[]>(() => STATUS_OPTIONS, [])

    return (
        <div className={styles.container}>
            <div className={styles.filterField}>
                <label htmlFor='work-showcase-search'>Search</label>
                <div className={styles.searchInputWrap}>
                    <IconOutline.SearchIcon className={styles.searchIcon} />
                    <input
                        id='work-showcase-search'
                        aria-label='Search showcase posts'
                        className={styles.searchInput}
                        onChange={props.onSearchInputChange}
                        placeholder='Search posts'
                        type='text'
                        value={props.keywordInput}
                    />
                </div>
            </div>

            <div className={styles.filterField}>
                <label htmlFor='work-showcase-status'>Status</label>
                <Select
                    inputId='work-showcase-status'
                    className='react-select-container'
                    classNamePrefix='select'
                    isClearable
                    options={statusOptions}
                    value={props.selectedStatus}
                    onChange={props.onStatusChange}
                />
            </div>

            <div className={styles.filterField}>
                <label htmlFor='work-showcase-industry'>Industry</label>
                <Select
                    inputId='work-showcase-industry'
                    className='react-select-container'
                    classNamePrefix='select'
                    isClearable
                    options={props.industryOptions}
                    value={props.selectedIndustry}
                    onChange={props.onIndustryChange}
                    isLoading={props.isIndustriesLoading}
                />
            </div>

            <div className={styles.filterField}>
                <label htmlFor='work-showcase-category'>Category</label>
                <Select
                    inputId='work-showcase-category'
                    className='react-select-container'
                    classNamePrefix='select'
                    isClearable
                    options={props.categoryOptions}
                    value={props.selectedCategory}
                    onChange={props.onCategoryChange}
                    isLoading={props.isCategoriesLoading}
                />
            </div>

            <div className={styles.actions}>
                <Button
                    secondary
                    size='lg'
                    label='Clear Filters'
                    onClick={props.onResetFilters}
                />
            </div>
        </div>
    )
}

export default ProjectsShowcaseFilter
