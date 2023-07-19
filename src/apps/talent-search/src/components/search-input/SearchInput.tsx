import { FC, useMemo } from 'react'

import { IconOutline, InputMultiselectOption } from '~/libs/ui'
import { EmsiSkill, EmsiSkillSources, InputSkillSelector, Skill } from '~/libs/shared'

import styles from './SearchInput.module.scss'

interface SearchInputProps {
    className?: string
    readonly autoFocus?: boolean
    onChange: (skills: Skill[]) => void
    skills: Skill[]
    onSearch?: () => void
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

    return (
        <InputSkillSelector
            className={props.className}
            autoFocus={props.autoFocus}
            placeholder='Enter skills you are searching for...'
            useWrapper={false}
            theme='clear'
            dropdownIcon={<IconOutline.SearchIcon className={styles.searchIcon} />}
            value={emsiSkills}
            onChange={onChange}
            onSubmit={props.onSearch}
        />
    )
}

export default SearchInput
