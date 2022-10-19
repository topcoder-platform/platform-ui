import { Dictionary, groupBy } from 'lodash'
import { ChangeEvent, ChangeEventHandler, Dispatch, FC, ReactNode, SetStateAction, useEffect, useMemo, useState } from 'react'

import { InputSelect, useSessionStorage } from '../../../../lib'
import { LearnCertification } from '../../learn-lib'
import { SortOption } from '../my-learning-sort-options'

import styles from './TabContentLayout.module.scss'

interface TabContentLayoutProps {
    certifications: ReadonlyArray<LearnCertification>
    children: ReactNode
    disableFilters?: boolean
    onCategoryChange?: (category: string) => void
    onSortChange?: (field: string) => void
    sortOptions: ReadonlyArray<SortOption>
    title: string
}

const TabContentLayout: FC<TabContentLayoutProps> = (props: TabContentLayoutProps) => {

    const [sortingField, setSortingField]: [
        string,
        Dispatch<SetStateAction<string>>
    ] = useSessionStorage<string>(`my-learn-sort[${props.title}]`, props.sortOptions[0].value)

    const [selectedCategory, setSelectedCategory]: [
        string,
        Dispatch<SetStateAction<string>>
    ] = useState<string>('')

    // compute all the available category dropdown options
    const certsCategoriesOptions: Array<{
        label: string,
        value: string,
    }> = useMemo(() => {
        const certsByCategory: Dictionary<Array<LearnCertification>> = groupBy(props.certifications, 'category')
        return [
            {label: 'All Categories', value: ''},
            ...Object.keys(certsByCategory).sort().map((c) => ({
                label: c,
                value: c,
            })),
        ]
    }, [props.certifications])

    const handleCategoryChange: ChangeEventHandler = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedCategory(e.target.value)
        props.onCategoryChange?.(e.target.value)
    }

    const handleSortChange: ChangeEventHandler = (e: ChangeEvent<HTMLInputElement>) => {
        setSortingField(e.target.value)
        props.onSortChange?.(e.target.value)
    }

    useEffect(() => {
      props.onCategoryChange?.(selectedCategory)
      props.onSortChange?.(sortingField)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.onCategoryChange, props.onSortChange])

    return (
        <div className={styles['wrap']}>
            <div className={styles['title-line']}>
                <h2 className='details'>{props.title}</h2>

                <div className={styles['courses-list-filters']}>
                    <InputSelect
                        options={certsCategoriesOptions}
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        name='filter-courses'
                        label='Categories'
                        disabled={props.disableFilters}
                    ></InputSelect>
                    <InputSelect
                        options={props.sortOptions}
                        value={sortingField}
                        onChange={handleSortChange}
                        name='sort-courses'
                        label='Sort by'
                        disabled={props.disableFilters}
                    ></InputSelect>
                </div>
            </div>
            {props.children}
        </div>
    )
}

export default TabContentLayout
