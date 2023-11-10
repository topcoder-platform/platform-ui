import { ChangeEvent, FC, ReactNode, Ref } from 'react'
import { SelectInstance } from 'react-select'
import { noop } from 'lodash'

import { InputMultiselect, InputMultiselectOption, InputMultiselectThemes } from '~/libs/ui'
import { SearchUserSkill, UserSkill } from '~/libs/core'

import { autoCompleteSkills, isSkillVerified } from '../../services/standard-skills'

const mapSkillToInputOption = (skill: SearchUserSkill): InputMultiselectOption => ({
    ...skill,
    label: skill.name,
    value: skill.id,
    verified: isSkillVerified(skill as SearchUserSkill & Pick<UserSkill, 'levels'>),
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
                value: skill.id,
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
    readonly value?: SearchUserSkill[]
    readonly theme?: InputMultiselectThemes
    readonly useWrapper?: boolean
    readonly dropdownIcon?: ReactNode
    readonly onSubmit?: () => void
    readonly additionalPlaceholder?: string
    readonly inputRef?: Ref<any>
    // Custom method to filter whether an option should be displayed in the menu
    readonly filterOption?: SelectInstance['filterOption']
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
        value={props.value?.map(mapSkillToInputOption)}
        loading={props.loading}
        theme={props.theme}
        useWrapper={props.useWrapper}
        dropdownIcon={props.dropdownIcon}
        onSubmit={props.onSubmit}
        additionalPlaceholder={props.additionalPlaceholder}
        inputRef={props.inputRef}
        filterOption={props.filterOption}
    />
)

export default InputSkillSelector
