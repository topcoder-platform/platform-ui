import { FC, MouseEvent, Ref, useMemo } from 'react'
import classNames from 'classnames'

import { IconOutline, InputMultiselectOption } from '~/libs/ui'
import { EmsiSkill, EmsiSkillSources, InputSkillSelector, Skill } from '~/libs/shared'

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
    const emsiSkills: EmsiSkill[] = useMemo(() => props.skills.map(s => ({
        name: s.name,
        skillId: s.emsiId,
        skillSources: [EmsiSkillSources.selfPicked],
    })), [props.skills])

    function onChange(ev: any): void {
        const options = (ev.target.value as unknown) as InputMultiselectOption[]
        props.onChange(options.map(v => ({
            emsiId: v.value,
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
            className={classNames(styles.searchIcon, !emsiSkills.length && styles.disabled)}
            onClick={handleSearchClick}
            onTouchStart={handleSearchClick as any}
        >
            <IconOutline.SearchIcon />
        </div>
    ), [props.onSearch, emsiSkills])

    return (
        <InputSkillSelector
            className={props.className}
            autoFocus={props.autoFocus}
            placeholder='Enter skills you are searching for...'
            useWrapper={false}
            theme='clear'
            dropdownIcon={searchIcon}
            value={emsiSkills}
            onChange={onChange}
            onSubmit={props.onSearch}
            inputRef={props.inputRef}
            limit={SKILL_SEARCH_LIMIT}
        />
    )
}

export default SearchInput
