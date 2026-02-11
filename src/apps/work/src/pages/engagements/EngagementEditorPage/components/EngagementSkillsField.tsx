/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useMemo,
    useState,
} from 'react'
import {
    useController,
    UseControllerReturn,
    useFormContext,
} from 'react-hook-form'
import Select from 'react-select'

import {
    FormFieldWrapper,
    FormSelectOption,
} from '../../../../lib/components/form'
import {
    Skill,
} from '../../../../lib/models'
import {
    useSearchSkills,
} from '../../../../lib/hooks'

import styles from './EngagementSkillsField.module.scss'

interface EngagementSkillsFieldProps {
    disabled?: boolean
}

interface SkillOption extends FormSelectOption {
    name: string
}

function toSkillOptions(skills: Skill[]): SkillOption[] {
    return skills.map(skill => ({
        label: `${skill.name} (${skill.id})`,
        name: skill.name,
        value: skill.id,
    }))
}

function toSelectedOptions(value: unknown): SkillOption[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map(item => {
            if (typeof item === 'string') {
                return {
                    label: item,
                    name: item,
                    value: item,
                }
            }

            if (typeof item === 'object' && item) {
                const skillValue = item as {
                    id?: string
                    name?: string
                    value?: string
                    label?: string
                }

                const id = (skillValue.id || skillValue.value || '').trim()
                const name = (skillValue.name || skillValue.label || id).trim()

                if (!id || !name) {
                    return undefined
                }

                return {
                    label: `${name} (${id})`,
                    name,
                    value: id,
                }
            }

            return undefined
        })
        .filter((option): option is SkillOption => !!option)
}

function toFieldValue(options: SkillOption[]): Skill[] {
    return options.map(option => ({
        id: option.value,
        name: option.name,
    }))
}

export const EngagementSkillsField: FC<EngagementSkillsFieldProps> = (
    props: EngagementSkillsFieldProps,
) => {
    const formContext = useFormContext()
    const controller: UseControllerReturn = useController({
        control: formContext.control,
        name: 'skills',
    })

    const [searchTerm, setSearchTerm] = useState<string>('')

    const searchedSkills = useSearchSkills(searchTerm)

    const options = useMemo(
        () => toSkillOptions(searchedSkills.skills),
        [searchedSkills.skills],
    )

    const selectedOptions = useMemo(
        () => toSelectedOptions(controller.field.value),
        [controller.field.value],
    )

    const menuPortalTarget = useMemo(
        () => (typeof document === 'undefined' ? undefined : document.body),
        [],
    )

    return (
        <FormFieldWrapper
            error={controller.fieldState.error?.message}
            hint={searchedSkills.error?.message}
            label='Skills'
            name='skills'
            required
        >
            <Select
                className={styles.select}
                classNamePrefix='challenge-select'
                id='skills'
                isDisabled={props.disabled}
                isLoading={searchedSkills.isLoading}
                isMulti
                menuPortalTarget={menuPortalTarget}
                onBlur={controller.field.onBlur}
                onChange={nextValue => {
                    const selected = Array.isArray(nextValue)
                        ? nextValue as SkillOption[]
                        : []

                    controller.field.onChange(toFieldValue(selected))
                }}
                onInputChange={nextValue => {
                    setSearchTerm(nextValue)
                    return nextValue
                }}
                options={options}
                placeholder='Search skills'
                value={selectedOptions}
            />
        </FormFieldWrapper>
    )
}

export default EngagementSkillsField
