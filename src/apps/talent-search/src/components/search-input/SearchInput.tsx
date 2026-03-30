import { FC, MouseEvent, Ref, useMemo } from 'react'
import classNames from 'classnames'

import { IconOutline, InputMultiselectOption } from '~/libs/ui'
import { InputSkillSelector } from '~/libs/shared'
import { UserSkill } from '~/libs/core'

import {
    SKILL_SEARCH_LIMIT,
    SKILL_SEARCH_MINIMUM,
} from '../../config'

import styles from './SearchInput.module.scss'

interface SearchInputProps {
    className?: string
    readonly autoFocus?: boolean
    onChange: (skills: Pick<UserSkill, 'id' | 'name'>[]) => void
    skills: UserSkill[]
    onSearch?: () => void
    inputRef?: Ref<any>
}

const SearchInput: FC<SearchInputProps> = props => {
    const skills = useMemo(() => props.skills.map(s => ({
        category: s.category,
        id: s.id,
        levels: [],
        name: s.name,
    })), [props.skills])
    const canSearch = skills.length >= SKILL_SEARCH_MINIMUM

    function onChange(ev: any): void {
        const options = (ev.target.value as unknown) as InputMultiselectOption[]
        props.onChange(options.map(v => ({
            id: v.value,
            name: v.label as string,
        })))
    }

    function handleSearchSubmit(): void {
        if (!canSearch) {
            return
        }

        props.onSearch?.()
    }

    function handleSearchClick(ev: MouseEvent<HTMLDivElement>): void {
        ev.preventDefault()
        ev.stopPropagation()

        handleSearchSubmit()
    }

    const searchIcon = (
        <div
            className={classNames(styles.searchIcon, !canSearch && styles.disabled)}
            onClick={handleSearchClick}
            onTouchStart={handleSearchClick as any}
        >
            <IconOutline.SearchIcon />
        </div>
    )

    return (
        <div className={styles.wrap}>
            <InputSkillSelector
                className={props.className}
                autoFocus={props.autoFocus}
                placeholder='Enter skills you are searching for...'
                useWrapper={false}
                theme='clear'
                dropdownIcon={searchIcon}
                value={skills}
                onChange={onChange}
                onSubmit={handleSearchSubmit}
                inputRef={props.inputRef}
                limit={SKILL_SEARCH_LIMIT}
            />
            {skills.length > 0 && skills.length < SKILL_SEARCH_MINIMUM && (
                <div className={styles.maxLimit}>
                    {`Please select at least ${SKILL_SEARCH_MINIMUM} skills to search`}
                </div>
            )}
            {skills.length >= SKILL_SEARCH_LIMIT && (
                <div className={styles.maxLimit}>
                    {`You can only search up to ${SKILL_SEARCH_LIMIT} skills at one time`}
                </div>
            )}
        </div>
    )
}

export default SearchInput
