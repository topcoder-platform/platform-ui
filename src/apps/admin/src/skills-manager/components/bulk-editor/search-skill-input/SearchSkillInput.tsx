import { ChangeEvent, FC, useMemo } from 'react'
import { escapeRegExp } from 'lodash'
import { FilterOptionOption } from 'react-select/dist/declarations/src/filters'

import { InputSelectReact } from '~/libs/ui'

import { mapSkillToSelectOption } from '../../../lib'
import { StandardizedSkill } from '../../../services'

interface SearchSkillInputProps {
    skills: StandardizedSkill[]
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

const normalize = (s: string): string => (s || '')
    .trim()
    .toLowerCase()

const SearchSkillInput: FC<SearchSkillInputProps> = props => {
    const skillsOptionsList = useMemo(() => (
        mapSkillToSelectOption(props.skills)
    ), [props.skills])

    function filterOptions(o: FilterOptionOption<any>, v: string): boolean {
        const normValue = normalize(v)
        const normLabel = normalize(o.label)

        if (v.length < 3 && normValue !== normLabel) {
            return false
        }

        const m = new RegExp(escapeRegExp(normValue), 'i')
        return !!normLabel.match(m)
    }

    return (
        <InputSelectReact
            placeholder='Search skills'
            options={skillsOptionsList}
            name='select-skill'
            onChange={props.onChange}
            openMenuOnClick={false}
            openMenuOnFocus={false}
            filterOption={filterOptions}
        />
    )
}

export default SearchSkillInput
