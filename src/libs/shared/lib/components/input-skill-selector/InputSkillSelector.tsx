import { ChangeEvent, FC } from 'react'
import { noop } from 'lodash'

import { InputMultiselect, InputMultiselectOption } from '~/libs/ui'

import { autoCompleteSkills, EmsiSkill, EmsiSkillSources } from '../../services/emsi-skills'

const mapEmsiSkillToInputOption = (s: EmsiSkill): InputMultiselectOption => ({
    ...s,
    label: s.name,
    value: s.skillId,
    verified: s.skillSources.includes(EmsiSkillSources.challengeWin),
})

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
    readonly loading?: boolean
    readonly value?: EmsiSkill[]
    readonly onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

const InputSkillSelector: FC<InputSkillSelectorProps> = props => (
    <InputMultiselect
        label='Select Skills'
        placeholder='Type to add a skill...'
        onFetchOptions={fetchSkills}
        name='skills'
        onChange={props.onChange ?? noop}
        value={props.value?.map(mapEmsiSkillToInputOption)}
        loading={props.loading}
    />
)

export default InputSkillSelector
