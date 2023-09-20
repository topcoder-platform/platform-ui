import { FC, MouseEvent, Ref, useMemo } from 'react'
import classNames from 'classnames'

import { IconOutline, InputMultiselectOption } from '~/libs/ui'
import { InputSkillSelector, Skill, SkillSources } from '~/libs/shared'

import { SKILL_SEARCH_LIMIT } from '../../config'

import styles from './SearchInput.module.scss'

interface SearchInputProps {
    className?: string
    readonly autoFocus?: boolean
    onChange: (skills: Skill[]) => void
    skills: Skill[]
    onSearch?: () => void
    inputRef?: Ref<any>
}

const SearchInput: FC<SearchInputProps> = props => {
    const skills: Skill[] = useMemo(() => props.skills.map(s => ({
        id: s.id,
        name: s.name,
        skillSources: [SkillSources.selfPicked],
    })), [props.skills])

    function onChange(ev: any): void {
        const options = (ev.target.value as unknown) as InputMultiselectOption[]
        props.onChange(options.map(v => ({
            id: v.value,
            name: v.label as string,
        })))
    }

    function handleSearchClick(ev: MouseEvent<HTMLDivElement>): void {
        ev.preventDefault()
        ev.stopPropagation()

        props.onSearch?.()
    }

    const searchIcon = useMemo(() => (
        <div
            className={classNames(styles.searchIcon, !skills.length && styles.disabled)}
            onClick={handleSearchClick}
            onTouchStart={handleSearchClick as any}
        >
            <IconOutline.SearchIcon />
        </div>
    ), [props.onSearch, skills])

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
                onSubmit={props.onSearch}
                inputRef={props.inputRef}
                limit={SKILL_SEARCH_LIMIT}
            />
            {skills.length >= SKILL_SEARCH_LIMIT && (
                <div className={styles.maxLimit}>
                    {`You can only search up to ${SKILL_SEARCH_LIMIT} skills at one time`}
                </div>
            )}
        </div>
    )
}

export default SearchInput
