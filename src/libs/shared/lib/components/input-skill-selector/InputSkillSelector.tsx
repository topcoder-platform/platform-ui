import { ChangeEvent, FC } from 'react'
import { noop } from 'lodash'

import { InputMultiselect } from '~/libs/ui'

import { autoCompleteSkills } from '../../services/emsi-skills'

interface Option {
    label: string
    value: string
}

const fetchSkills = (queryTerm: string): Promise<Option[]> => (
    autoCompleteSkills(queryTerm)
        .then(skills => (
            skills.map(skill => ({
                label: skill.name,
                value: skill.emsiId,
            }))
        ))
)

interface InputSkillSelectorProps {
    readonly onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

const InputSkillSelector: FC<InputSkillSelectorProps> = props => (
    <InputMultiselect
        label='Select Skills'
        placeholder='Type to add a skill...'
        onFetchOptions={fetchSkills}
        name='skills'
        onChange={props.onChange ?? noop}
    />
)

export default InputSkillSelector
