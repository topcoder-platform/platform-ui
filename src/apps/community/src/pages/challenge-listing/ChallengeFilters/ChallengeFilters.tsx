import { ChangeEvent, FC, FocusEvent, useCallback } from 'react'

import { Button, InputText } from '~/libs/ui'

import { SORT_OPTIONS } from '../../../lib'

import styles from './ChallengeFilters.module.scss'

export interface ChallengeFiltersProps {
    onClear: () => void
    onSearchChange: (value: string) => void
    onSortChange: (value: string) => void
    search: string
    sortBy: string
}

/**
 * Search and sort controls for the challenge listing page.
 *
 * @param props Current filter values and change handlers.
 * @returns Filter row with search, sort and clear actions.
 */
const ChallengeFilters: FC<ChallengeFiltersProps> = (props: ChallengeFiltersProps) => {
    const handleSearchChange = useCallback(
        (event: FocusEvent<HTMLInputElement>) => {
            props.onSearchChange(event.target.value)
        },
        [props.onSearchChange],
    )

    const handleSortChange = useCallback(
        (event: ChangeEvent<HTMLSelectElement>) => {
            props.onSortChange(event.target.value)
        },
        [props.onSortChange],
    )

    return (
        <div className={styles.filters}>
            <div className={styles.search}>
                <InputText
                    classNameWrapper={styles.searchInput}
                    forceUpdateValue
                    label={<span className={styles.srOnly}>Search challenges</span>}
                    name='challenge-search'
                    onChange={handleSearchChange}
                    placeholder='Search by challenge title'
                    type='text'
                    value={props.search}
                />
            </div>

            <div className={styles.sort}>
                <label className={styles.label} htmlFor='challenge-sort'>
                    Sort By
                </label>
                <select
                    className={styles.sortSelect}
                    id='challenge-sort'
                    onChange={handleSortChange}
                    value={props.sortBy}
                >
                    {SORT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.actions}>
                <Button
                    label='Clear'
                    onClick={props.onClear}
                    secondary
                />
            </div>
        </div>
    )
}

export default ChallengeFilters
