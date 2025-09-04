import React, { useCallback } from 'react'
import classNames from 'classnames'

import { Button, IconOutline, InputSelect, InputWrapper } from '~/libs/ui'

import {
    categoryByProjectType,
    ProjectType,
    ProjectTypeLabels,
    ScorecardStatus,
    ScorecardStatusLabels,
    ScorecardType,
    ScorecardTypeLabels,
} from '../../models'

import styles from './ScorecardsFilter.module.scss'

interface ScorecardFiltersProps {
  filters: {
    name: string
    type: string
    projectType: string
    category: string
    status: string
  }
  onFiltersChange: (newFilters: ScorecardFiltersProps['filters']) => void
}

export const ScorecardFilters: React.FC<ScorecardFiltersProps> = (props: ScorecardFiltersProps) => {

    const projectTypeOptions = [
        { label: 'All Projects', value: '' },
        ...Object.values(ProjectType)
            .map(type => ({
                label: ProjectTypeLabels[type],
                value: type,
            })),
    ]

    const typeOptions = [
        { label: 'All Types', value: '' },
        ...Object.values(ScorecardType)
            .map(type => ({
                label: ScorecardTypeLabels[type],
                value: type,
            })),
    ]

    const statusOptions = [
        { label: 'All Status', value: '' },
        ...Object.values(ScorecardStatus)
            .map(status => ({
                label: ScorecardStatusLabels[status],
                value: status,
            })),
    ]

    const categoryOptions = [
        { label: 'All Categories', value: '' },
        ...(props.filters.projectType
            ? (categoryByProjectType[props.filters.projectType as ProjectType] || []).map(category => ({
                label: category,
                value: category,
            }))
            : []),
    ]

    const handleChange
    = (key: keyof ScorecardFiltersProps['filters']) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.value
        const newFilters = {
            ...props.filters,
            [key]: value,
        }

        // Clear category if projectType changed
        if (key === 'projectType') {
            newFilters.category = ''
        }

        props.onFiltersChange(newFilters)
    }

    const handleClear = useCallback(() => {
        props.onFiltersChange({
            category: '',
            name: '',
            projectType: '',
            status: '',
            type: '',
        })
    }, [])

    return (
        <div className={styles.filtersContainer}>
            {/* Search */}
            <InputWrapper
                dirty={false}
                disabled={false}
                label=''
                type='text'
                className={styles.inputWrapper}
            >
                <input
                    className={classNames(styles.inputText, 'body-small')}
                    value={props.filters.name}
                    onChange={handleChange('name')}
                    placeholder='Scorecard Name'
                    type='text'
                />
                <div className={styles.inputIcon}>
                    <IconOutline.SearchIcon className='icon-lg' />
                </div>
            </InputWrapper>

            {/* Type */}
            <InputSelect
                classNameWrapper={styles.typeSelect}
                name='type'
                options={typeOptions}
                value={props.filters.type}
                onChange={handleChange('type')}
                dirty
            />

            {/* Project */}
            <InputSelect
                classNameWrapper={styles.projectTypeSelect}
                name='projectType'
                options={projectTypeOptions}
                value={props.filters.projectType}
                onChange={handleChange('projectType')}
                dirty
            />

            {/* Category */}
            <InputSelect
                classNameWrapper={styles.categorySelect}
                name='category'
                options={categoryOptions}
                value={props.filters.category}
                onChange={handleChange('category')}
                dirty
                disabled={!props.filters.projectType}
            />

            {/* Status */}
            <InputSelect
                classNameWrapper={styles.statusSelect}
                name='status'
                options={statusOptions}
                value={props.filters.status}
                onChange={handleChange('status')}
                dirty
            />

            {/* Clear */}
            <Button
                className={styles.clearButton}
                label='Clear'
                secondary
                size='lg'
                onClick={handleClear}
                icon={IconOutline.XIcon}
                iconToLeft
            />
        </div>
    )
}

export default ScorecardFilters
