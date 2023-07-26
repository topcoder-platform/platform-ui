import { ChangeEvent, FC, ReactNode, Ref } from 'react'
import { noop } from 'lodash'

import { InputMultiselect, InputMultiselectOption, InputMultiselectThemes } from '~/libs/ui'

import { autoCompleteSkills, EmsiSkill, isSkillVerified } from '../../services/emsi-skills'

const mapEmsiSkillToInputOption = (skill: EmsiSkill): InputMultiselectOption => ({
    ...skill,
    label: skill.name,
    value: skill.skillId,
    verified: isSkillVerified(skill),
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
    readonly className?: string
    readonly autoFocus?: boolean
    readonly limit?: number
    readonly label?: string
    readonly loading?: boolean
    readonly onChange?: (event: ChangeEvent<HTMLInputElement>) => void
    readonly placeholder?: string
    readonly value?: EmsiSkill[]
    readonly theme?: InputMultiselectThemes
    readonly useWrapper?: boolean
    readonly dropdownIcon?: ReactNode
    readonly onSubmit?: () => void
    readonly additionalPlaceholder?: string
    readonly inputRef?: Ref<any>
}

const InputSkillSelector: FC<InputSkillSelectorProps> = props => (
    <InputMultiselect
        className={props.className}
        autoFocus={props.autoFocus}
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
        onSubmit={props.onSubmit}
        additionalPlaceholder={props.additionalPlaceholder}
        inputRef={props.inputRef}
    />
)

export default InputSkillSelector
