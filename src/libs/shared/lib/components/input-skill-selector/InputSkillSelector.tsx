import { ChangeEvent, FC, ReactNode } from 'react'
import { noop } from 'lodash'

import { InputMultiselect, InputMultiselectOption, InputMultiselectThemes } from '~/libs/ui'

import { autoCompleteSkills, EmsiSkill, EmsiSkillSources } from '../../services/emsi-skills'

const mapEmsiSkillToInputOption = (s: EmsiSkill): InputMultiselectOption => ({
    ...s,
    label: s.name,
    value: s.skillId,
    verified: !!s.skillSources?.includes(EmsiSkillSources.challengeWin),
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
    readonly limit?: number
    readonly label?: string
    readonly loading?: boolean
    readonly onChange?: (event: ChangeEvent<HTMLInputElement>) => void
    readonly placeholder?: string
    readonly value?: EmsiSkill[]
    readonly theme?: InputMultiselectThemes
    readonly useWrapper?: boolean
    readonly dropdownIcon?: ReactNode
    readonly additionalPlaceholder?: string
}

const InputSkillSelector: FC<InputSkillSelectorProps> = props => (
    <InputMultiselect
        label={props.label ?? 'Select Skills'}
        limit={props.limit}
        placeholder={props.placeholder ?? 'Type to add a skill...'}
        onFetchOptions={fetchSkills}
        name='skills'
        onChange={props.onChange ?? noop}
        value={props.value?.map(mapEmsiSkillToInputOption)}
        loading={props.loading}
        theme={props.theme}
        useWrapper={props.useWrapper}
        dropdownIcon={props.dropdownIcon}
        additionalPlaceholder={props.additionalPlaceholder}
    />
)

export default InputSkillSelector
